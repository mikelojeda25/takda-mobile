import { useEffect, useRef, useState } from 'react';
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
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getNextAlarmDate } from '../utils/alarmUtils';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alarm', {
      name: 'Takda Alarms',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#fcda80',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: '2d3a7684-6102-4f91-934f-88d3032ffd30',
  })).data;

  return token;
}

async function scheduleAlarmNotification(alarm) {
  await Notifications.cancelScheduledNotificationAsync(alarm.id).catch(() => {});
  if (!alarm.active) return;

  const next = getNextAlarmDate(alarm);
  if (!next) return;

  await Notifications.scheduleNotificationAsync({
    identifier: alarm.id,
    content: {
      title: `⏰ ${alarm.title}`,
      body: alarm.description || 'Your alarm is ringing!',
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { alarmId: alarm.id },
      channelId: 'alarm',
    },
    trigger: {
      date: next,
      channelId: 'alarm',
    },
  });
}

export function useAlarms(onRing) {
  const { user } = useAuth();
  const [alarms, setAlarms] = useState([]);

  // Register push token and save to Firestore
  useEffect(() => {
    if (!user) return;
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await setDoc(doc(db, 'userTokens', user.uid), {
          expoPushToken: token,
          uid: user.uid,
          name: user.displayName,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    })();
  }, [user]);

  // Listen for notification responses (when user taps notification)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const alarmId = response.notification.request.content.data?.alarmId;
      if (alarmId && onRing) {
        const alarm = alarms.find((a) => a.id === alarmId);
        if (alarm) onRing(alarm);
      }
    });
    return () => sub.remove();
  }, [alarms]);

  // Listen for foreground notifications
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const alarmId = notification.request.content.data?.alarmId;
      if (alarmId && onRing) {
        const alarm = alarms.find((a) => a.id === alarmId);
        if (alarm) onRing(alarm);
      }
    });
    return () => sub.remove();
  }, [alarms]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'alarms'),
      where('members', 'array-contains', user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAlarms(list);
      list.forEach((alarm) => scheduleAlarmNotification(alarm));
    });

    return unsub;
  }, [user]);

  const createAlarm = async (form) => {
    if (!user) return;
    const docRef = await addDoc(collection(db, 'alarms'), {
      ...form,
      createdBy: user.uid,
      creatorName: user.displayName,
      creatorPhoto: user.photoURL,
      members: [user.uid],
      memberDetails: [{
        uid: user.uid,
        name: user.displayName,
        photoURL: user.photoURL,
      }],
      active: true,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const updateAlarm = async (id, form) => {
    await updateDoc(doc(db, 'alarms', id), form);
  };

  const deleteAlarm = async (id) => {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    await deleteDoc(doc(db, 'alarms', id));
  };

  const toggleAlarm = async (id, current) => {
    await updateDoc(doc(db, 'alarms', id), { active: !current });
  };

  const joinAlarm = async (alarmId) => {
    if (!user) return;
    await updateDoc(doc(db, 'alarms', alarmId), {
      members: arrayUnion(user.uid),
      memberDetails: arrayUnion({
        uid: user.uid,
        name: user.displayName,
        photoURL: user.photoURL,
      }),
    });
  };

  return { alarms, createAlarm, updateAlarm, deleteAlarm, toggleAlarm, joinAlarm };
}
