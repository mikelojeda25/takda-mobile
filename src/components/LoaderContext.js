import React, { createContext, useState, useContext, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import LoaderScreen from "./LoaderScreen";

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LoaderContext.Provider value={{ loading, setLoading }}>
      {children}
      {loading && (
        <View style={styles.overlay}>
          <LoaderScreen />
        </View>
      )}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
