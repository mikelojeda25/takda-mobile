import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBotTZ6easx9iXUO17lghg6dWRXusfsYS4',
  authDomain: 'takda-8de4d.firebaseapp.com',
  projectId: 'takda-8de4d',
  storageBucket: 'takda-8de4d.firebasestorage.app',
  messagingSenderId: '1001772889118',
  appId: '1:1001772889118:web:d2a17edac9c6985ffb6a0f',
  measurementId: 'G-5WB517LK4Z',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
