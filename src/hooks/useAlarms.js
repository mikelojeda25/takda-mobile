import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  arrayUnion,
  setDoc,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuth } from "../contexts/AuthContext";
import { getNextAlarmDate } from "../utils/alarmUtils";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import notifee, {
  TriggerType,
  AndroidImportance,
  AndroidVisibility,
  EventType,
} from "@notifee/react-native";

// Handle background events
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
    await notifee.cancelNotification(detail.notification.id);
  }
});

async function createNotifeeChannel() {
  await notifee.createChannel({
    id: "takda-alarm",
    name: "Takda Alarms",
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: "default",
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
    bypassDnd: true,
    lights: true,
    lightColor: "#fcda80",
  });
}

async function scheduleAlarmWithNotifee(alarm) {
  // Cancel existing
  try {
    await notifee.cancelTriggerNotification(alarm.id);
  } catch {}

  if (!alarm.active) return;

  const next = getNextAlarmDate(alarm);
  if (!next || next < new Date()) return;

  await notifee.createTriggerNotification(
    {
      id: alarm.id,
      title: `⏰ ${alarm.title}`,
      body: alarm.description || "Your alarm is ringing!",
      android: {
        channelId: "takda-alarm",
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        sound: "default",
        vibrationPattern: [300, 500, 300, 500],
        pressAction: { id: "default" },
        fullScreenAction: {
          id: "default",
        },
        showTimestamp: true,
        timestamp: next.getTime(),
        color: "#fcda80",
      },
      data: { alarmId: alarm.id },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: next.getTime(),
      alarmManager: {
        allowWhileIdle: true,
      },
    },
  );
}

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return null;
  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId: "2d3a7684-6102-4f91-934f-88d3032ffd30",
    })
  ).data;
  return token;
}

export function useAlarms(onRing) {
  const { user } = useAuth();
  const [alarms, setAlarms] = useState([]);

  // Setup Notifee channel + permissions
  useEffect(() => {
    (async () => {
      await createNotifeeChannel();
      await notifee.requestPermission();
    })();
  }, []);

  // Save push token
  useEffect(() => {
    if (!user) return;
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await setDoc(
          doc(db, "userTokens", user.uid),
          {
            expoPushToken: token,
            uid: user.uid,
            name: user.displayName,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }
    })();
  }, [user]);

  // Foreground event listener
  useEffect(() => {
    const unsub = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.DELIVERED && detail.notification?.data?.alarmId) {
        const alarmId = detail.notification.data.alarmId;
        const alarm = alarms.find((a) => a.id === alarmId);
        if (alarm && onRing) onRing(alarm);
      }
    });
    return unsub;
  }, [alarms]);

  // Listen to Firestore alarms
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "alarms"),
      where("members", "array-contains", user.uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAlarms(list);
      list.forEach((alarm) => scheduleAlarmWithNotifee(alarm));
    });

    return unsub;
  }, [user]);

  const createAlarm = async (form) => {
    if (!user) return;
    const docRef = await addDoc(collection(db, "alarms"), {
      ...form,
      createdBy: user.uid,
      creatorName: user.displayName,
      creatorPhoto: user.photoURL,
      members: [user.uid],
      memberDetails: [
        {
          uid: user.uid,
          name: user.displayName,
          photoURL: user.photoURL,
        },
      ],
      active: true,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const updateAlarm = async (id, form) => {
    await updateDoc(doc(db, "alarms", id), form);
  };

  const deleteAlarm = async (id) => {
    try {
      await notifee.cancelTriggerNotification(id);
    } catch {}
    await deleteDoc(doc(db, "alarms", id));
  };

  const toggleAlarm = async (id, current) => {
    await updateDoc(doc(db, "alarms", id), { active: !current });
  };

  const joinAlarm = async (alarmId) => {
    if (!user) return;
    await updateDoc(doc(db, "alarms", alarmId), {
      members: arrayUnion(user.uid),
      memberDetails: arrayUnion({
        uid: user.uid,
        name: user.displayName,
        photoURL: user.photoURL,
      }),
    });
  };

  return {
    alarms,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
    joinAlarm,
  };
}
