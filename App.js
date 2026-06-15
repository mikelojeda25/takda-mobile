import { registerRootComponent } from "expo";
import React from "react";
import { AuthProvider } from "./src/contexts/AuthContext";
import { LoaderProvider } from "./src/components/LoaderContext";
import AppNavigator from "./src/navigation/AppNavigator";

function App() {
  return (
    <LoaderProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </LoaderProvider>
  );
}

registerRootComponent(App);
