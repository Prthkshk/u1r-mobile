import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image, View } from "react-native";

import HomeB2B from "../screens/home/HomeB2B";
import CategoryScreen from "../screens/home/CategoryScreen";
import CartScreen from "../screens/home/CartScreen";
import ProfileScreen from "../screens/home/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigation() {
  const defaultTabStyle = {
    height: 105,
    paddingBottom: 15,
    paddingTop: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: "absolute",
    borderTopWidth: 1,
    borderColor: "#DCDCDC",
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle:
          route.name === "Cart"
            ? { display: "none" }
            : defaultTabStyle,

        tabBarIcon: ({ focused }) => {
          let icon;

          if (route.name === "HomeB2B") {
            icon = require("../assets/icons/home.png");
          } else if (route.name === "Category") {
            icon = require("../assets/icons/category.png");
          } else if (route.name === "Cart") {
            icon = require("../assets/icons/cart.png");
          } else if (route.name === "Profile") {
            icon = require("../assets/icons/profile.png");
          }

          return (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Image
                source={icon}
                style={{
                  width: 48,
                  height: 48,
                  tintColor: focused ? "#FF2E2E" : "#000",
                }}
                resizeMode="contain"
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="HomeB2B" component={HomeB2B} />
      <Tab.Screen name="Category" component={CategoryScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
