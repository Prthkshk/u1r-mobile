import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeB2B from "../screens/home/wholesale/HomeB2B";
import CategoryScreenWholesale from "../screens/home/wholesale/CategoryScreen";
import CartScreenWholesale from "../screens/home/wholesale/CartScreen";
import ProfileScreenWholesale from "../screens/home/wholesale/ProfileScreen";
import HomeB2C from "../screens/home/retail/HomeB2C";
import CategoryScreenRetail from "../screens/home/retail/CategoryScreen";
import CartScreenRetail from "../screens/home/retail/CartScreen";
import ProfileScreenRetail from "../screens/home/retail/ProfileScreen";
import { useUser } from "../context/UserContext";
import HomeIcon from "../assets/icons/home.svg";
import CategoryIcon from "../assets/icons/category.svg";
import CartIcon from "../assets/icons/cart.svg";
import ProfileIcon from "../assets/icons/profile.svg";

const Tab = createBottomTabNavigator();

export default function TabNavigation() {
  const insets = useSafeAreaInsets();
  const { mode } = useUser();
  const isRetail = mode === "retail";
  const HomeScreen = isRetail ? HomeB2C : HomeB2B;
  const CategoryScreen = isRetail ? CategoryScreenRetail : CategoryScreenWholesale;
  const CartScreen = isRetail ? CartScreenRetail : CartScreenWholesale;
  const ProfileScreen = isRetail ? ProfileScreenRetail : ProfileScreenWholesale;

  const ICON_SIZE = 30;
  const baseHeight = 70 + insets.bottom;
  const defaultTabStyle = {
    height: baseHeight,
    paddingBottom: Math.max(insets.bottom, 6),
    paddingTop: 6,
    paddingHorizontal: 18,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: "absolute",
    borderTopWidth: 1,
    borderColor: "#DCDCDC",
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 1,
          marginTop: -1,
        },
        tabBarIconStyle: { marginTop: 1 },
        tabBarActiveTintColor: "#FF2E2E",
        tabBarInactiveTintColor: "#111",
        tabBarItemStyle: {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 2,
          marginHorizontal: -1,
        },
        tabBarStyle:
          route.name === "Cart" ? { display: "none" } : defaultTabStyle,

        tabBarIcon: ({ focused }) => {
          let IconComponent;

          if (route.name === "Home") {
            IconComponent = HomeIcon;
          } else if (route.name === "Category") {
            IconComponent = CategoryIcon;
          } else if (route.name === "Cart") {
            IconComponent = CartIcon;
          } else if (route.name === "Profile") {
            IconComponent = ProfileIcon;
          }

          return (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: 42,
                height: 42,
              }}
            >
              <IconComponent
                width={ICON_SIZE}
                height={ICON_SIZE}
                color={focused ? "#FF2E2E" : "#111"}
                style={{ opacity: focused ? 1 : 0.95 }}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Category" component={CategoryScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
