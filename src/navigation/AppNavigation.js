import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeB2B from "../screens/home/HomeB2B";
import CategoryScreen from "../screens/home/CategoryScreen";
import CategoryNavigator from "../screens/home/CategoryNavigator";
import SubCategoryScreen from "../screens/home/SubCategoryScreen";
import ProductListScreen from "../screens/home/ProductListScreen";
import ProductDetailScreen from "../screens/home/ProductDetailScreen";
import SearchScreen from "../screens/home/SearchScreen";
import AddressBook from "../screens/home/AddressBook";
import AddAddress from "../screens/home/AddAddress";
import CheckoutScreen from "../screens/home/CheckoutScreen";
import OrderSuccess from "../screens/home/OrderSuccess";
import FAQScreen from "../screens/home/FAQScreen";
import RequestProduct from "../screens/home/RequestProduct";
import ProfileDetails from "../screens/home/ProfileDetails";
import WishlistScreen from "../screens/home/WishlistScreen";
import MyOrders from "../screens/home/MyOrders";
import Support from "../screens/home/Support";
import SupportChat from "../screens/home/SupportChat";
import OrderSummary from "../screens/home/OrderSummary";

import TabNavigation from "./TabNavigation";

import LoginScreen from "../screens/auth/LoginScreen";
import OtpScreen from "../screens/auth/OtpScreen";
import SplashScreen from "../screens/auth/SplashScreen";
import ShoppingModeScreen from "../screens/mode/ShoppingModeScreen";
import RegisterStep1 from "../screens/registration/RegisterStep1";
import RegisterStep2 from "../screens/registration/RegisterStep2";

const Stack = createNativeStackNavigator();

export default function AppNavigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="ShoppingMode" component={ShoppingModeScreen} />

      <Stack.Screen name="HomeTabs" component={TabNavigation} />

      {/* MAIN CATEGORY FLOW */}
      <Stack.Screen name="CategoryNavigator" component={CategoryNavigator} />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="SubCategoryScreen" component={SubCategoryScreen} />

      {/* FIX: ADD THIS SCREEN */}
      <Stack.Screen name="ProductListScreen" component={ProductListScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="AddressBook" component={AddressBook} />
      <Stack.Screen name="AddAddress" component={AddAddress} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccess} />
      <Stack.Screen name="FAQs" component={FAQScreen} />
      <Stack.Screen name="RequestProduct" component={RequestProduct} />
      <Stack.Screen name="ProfileDetails" component={ProfileDetails} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="MyOrders" component={MyOrders} />
      <Stack.Screen name="OrderSummary" component={OrderSummary} />
      <Stack.Screen name="Support" component={Support} />
      <Stack.Screen name="SupportChat" component={SupportChat} />

      <Stack.Screen name="RegisterStep1" component={RegisterStep1} />
      <Stack.Screen name="RegisterStep2" component={RegisterStep2} />

    </Stack.Navigator>
  );
}
