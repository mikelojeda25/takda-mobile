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
import notifee, {
  TriggerType,
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  EventType,
} from "@notifee/react-native";

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log("BACKGROUND EVENT:", type);
  if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
    await notifee.cancelNotification(detail.notification.id);
  }
});

async function getOrCreateChannel(soundName = "alarm_sound") {
  const channelId = `channel-${soundName}`;
  await notifee.createChannel({
    id: channelId,
    name: "Takda Alarms",
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: soundName,
    vibration: true,
    vibrationPattern: [500, 500, 500, 500],
    bypassDnd: true,
    lights: true,
    lightColor: "#fcda80",
  });
  return channelId;
}

async function scheduleAlarmWithNotifee(alarm) {
  try {
    await notifee.cancelTriggerNotification(alarm.id);
  } catch {}

  if (!alarm.active) return;

  const next = getNextAlarmDate(alarm);
  if (!next || next < new Date()) return;

  const soundToUse = alarm.sound || "alarm_sound";
  const channelId = await getOrCreateChannel(soundToUse);

  await notifee.createTriggerNotification(
    {
      id: alarm.id,
      title: `⏰ ${alarm.title}`,
      body: alarm.description || "Your alarm is ringing!",
      android: {
        channelId: channelId,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        sound: soundToUse,
        category: AndroidCategory.ALARM,
        pressAction: { id: "default", launchActivity: "default" },
        fullScreenAction: { id: "default", launchActivity: "default" },
        showTimestamp: true,
        timestamp: next.getTime(),
        color: "#fcda80",
        loopSound: true,
        ongoing: true,
        autoCancel: false,
      },
      data: { alarmId: alarm.id },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: next.getTime(),
      alarmManager: { allowWhileIdle: true },
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

export function useAlarms() {
  const { user } = useAuth();
  const [alarms, setAlarms] = useState([]);
  const [alarmsLoading, setAlarmsLoading] = useState(true);

  // FIX: was calling createNotifeeChannel() which doesn't exist
  // replaced with getOrCreateChannel() using the default sound
  useEffect(() => {
    (async () => {
      await getOrCreateChannel("alarm_sound");
      await notifee.requestPermission();
    })();
  }, []);

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

  useEffect(() => {
    if (!user) {
      setAlarmsLoading(false);
      return;
    }

    setAlarmsLoading(true);

    const q = query(
      collection(db, "alarms"),
      where("members", "array-contains", user.uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAlarms(list);
      setAlarmsLoading(false);
      list.forEach((alarm) => scheduleAlarmWithNotifee(alarm));
    });

    return () => {
      unsub();
      setAlarmsLoading(true);
    };
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
        { uid: user.uid, name: user.displayName, photoURL: user.photoURL },
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
    alarmsLoading,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
    joinAlarm,
  };
}
