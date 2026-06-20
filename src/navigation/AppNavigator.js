import React, { useState, useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuth } from "../contexts/AuthContext";

import notifee from "@notifee/react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import InviteScreen from "../screens/InviteScreen";
import AlarmRingScreen from "../screens/AlarmRingScreen";

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, authLoading } = useAuth();
  const [ringingAlarm, setRingingAlarm] = useState(null);
  const ringingRef = useRef(null);
  const dismissedAlarms = useRef(new Set());

  const triggerRing = (alarm) => {
    if (dismissedAlarms.current.has(alarm.id)) return; // already dismissed
    ringingRef.current = alarm;
    setRingingAlarm(alarm);
  };

  useEffect(() => {
    AsyncStorage.getItem("ringingAlarm").then((val) => {
      if (val) {
        setRingingAlarm(JSON.parse(val));
      }
    });
  }, []);

  useEffect(() => {
    const unsub = notifee.onForegroundEvent(({ type, detail }) => {
      console.log(
        "NAV EVENT TYPE:",
        type,
        "DATA:",
        JSON.stringify(detail.notification?.data),
      );
      if (type === 7 || type === 4 || type === 5 || type === 6) return;
      if (detail.notification?.data?.alarmId) {
        const alarmId = detail.notification.data.alarmId;
        getDoc(doc(db, "alarms", alarmId)).then((snap) => {
          if (snap.exists()) {
            console.log("SETTING RINGING ALARM:", snap.id);
            triggerRing({ id: snap.id, ...snap.data() });
          }
        });
      }
    });

    notifee.getInitialNotification().then((initial) => {
      console.log("NAV INITIAL:", JSON.stringify(initial));
      if (initial?.notification?.data?.alarmId) {
        const alarmId = initial.notification.data.alarmId;
        getDoc(doc(db, "alarms", alarmId)).then((snap) => {
          if (snap.exists()) triggerRing({ id: snap.id, ...snap.data() });
        });
      }
    });

    return unsub;
  }, []);

  if (authLoading) return null;

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Invite" component={InviteScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {ringingAlarm && (
        <AlarmRingScreen
          alarm={ringingAlarm}
          onDismiss={() => {
            dismissedAlarms.current.add(ringingAlarm.id);
            notifee.cancelNotification(ringingAlarm.id).catch(() => {});
            notifee.cancelTriggerNotification(ringingAlarm.id).catch(() => {});
            ringingRef.current = null;
            setRingingAlarm(null);
          }}
        />
      )}
    </>
  );
}
