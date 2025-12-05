import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigation from "./src/navigation/AppNavigation";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { TiltWarp_400Regular } from "@expo-google-fonts/tilt-warp";
import { Inder_400Regular } from "@expo-google-fonts/inder";
import { useFonts } from "expo-font";
import { CartProvider } from "./src/context/CartContext";
import { UserProvider } from "./src/context/UserContext";
import { WishlistProvider } from "./src/context/WishlistContext";

export default function App() {
  const [fontsLoaded] = useFonts({
    TiltWarp_400Regular,
    Inder_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UserProvider>
          <CartProvider>
            <WishlistProvider>
              <NavigationContainer>
                <AppNavigation />
              </NavigationContainer>
            </WishlistProvider>
          </CartProvider>
        </UserProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
