import React, { createContext, useContext, useEffect, useState } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../utils/firebase';

const AuthContext = createContext(null);

GoogleSignin.configure({
  webClientId: '1001772889118-64v1kr0evv7chgq4ib8vt27r0j5iprsr.apps.googleusercontent.com',
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const credential = GoogleAuthProvider.credential(userInfo.data?.idToken);
      await signInWithCredential(auth, credential);
    } catch (err) {
      if (err.code !== statusCodes.SIGN_IN_CANCELLED) {
        console.error('Login error:', err);
      }
    }
  };

  const logout = async () => {
    try {
      await GoogleSignin.signOut();
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
