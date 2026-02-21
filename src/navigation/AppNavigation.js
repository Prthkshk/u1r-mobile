import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CategoryNavigator from "../screens/home/wholesale/CategoryNavigator";
import SubCategoryScreen from "../screens/home/wholesale/SubCategoryScreen";
import ProductListScreen from "../screens/home/wholesale/ProductListScreen";
import ProductDetailScreen from "../screens/home/wholesale/ProductDetailScreen";
import SearchScreenWholesale from "../screens/home/wholesale/SearchScreen";
import RetailSearchScreen from "../screens/home/retail/RetailSearchScreen";
import CategoryScreenWholesale from "../screens/home/wholesale/CategoryScreen";
import AddressBook from "../screens/home/wholesale/AddressBook";
import AddAddress from "../screens/home/wholesale/AddAddress";
import CheckoutScreen from "../screens/home/wholesale/CheckoutScreen";
import OrderSuccess from "../screens/home/wholesale/OrderSuccess";
import RetailOrderSuccess from "../screens/home/retail/OrderSuccess";
import FAQScreen from "../screens/home/wholesale/FAQScreen";
import RequestProduct from "../screens/home/wholesale/RequestProduct";
import RetailRequestProduct from "../screens/home/retail/RequestProduct";
import ProfileDetails from "../screens/home/wholesale/ProfileDetails";
import RetailProfileDetails from "../screens/home/retail/ProfileDetails";
import WishlistScreen from "../screens/home/wholesale/WishlistScreen";
import RetailWishlistScreen from "../screens/home/retail/RetailWishlistScreen";
import MyOrders from "../screens/home/wholesale/MyOrders";
import RetailMyOrders from "../screens/home/retail/MyOrders";
import Support from "../screens/home/wholesale/Support";
import SupportChat from "../screens/home/wholesale/SupportChat";
import OrderSummary from "../screens/home/wholesale/OrderSummary";
import RetailSubCategoryScreen from "../screens/home/retail/RetailSubCategoryScreen";
import RetailProductListScreen from "../screens/home/retail/RetailProductListScreen";
import RetailProductDetailScreen from "../screens/home/retail/RetailProductDetailScreen";
import TermsConditionsScreen from "../screens/home/common/TermsConditionsScreen";
import PrivacyPolicyScreen from "../screens/home/common/PrivacyPolicyScreen";
import ShippingDeliveryPolicyScreen from "../screens/home/common/ShippingDeliveryPolicyScreen";
import RefundCancellationPolicyScreen from "../screens/home/common/RefundCancellationPolicyScreen";
import PaymentPolicyScreen from "../screens/home/common/PaymentPolicyScreen";
import NotificationsScreen from "../screens/home/common/NotificationsScreen";
import { useUser } from "../context/UserContext";

import TabNavigation from "./TabNavigation";

import LoginScreen from "../screens/auth/LoginScreen";
import OtpScreen from "../screens/auth/OtpScreen";
import SplashScreen from "../screens/auth/SplashScreen";
import ShoppingModeScreen from "../screens/mode/ShoppingModeScreen";
import RegisterStep1 from "../screens/registration/RegisterStep1";
import RegisterStep2 from "../screens/registration/RegisterStep2";

const Stack = createNativeStackNavigator();

export default function AppNavigation() {
  const { mode } = useUser();
  const isRetail = mode === "retail";
  const SearchScreen = ({ route, ...rest }) => (
    isRetail ? (
      <RetailSearchScreen route={route} {...rest} />
    ) : (
      <SearchScreenWholesale route={route} {...rest} />
    )
  );
  const MyOrdersScreen = ({ route, ...rest }) => (
    isRetail ? (
      <RetailMyOrders route={route} {...rest} />
    ) : (
      <MyOrders route={route} {...rest} />
    )
  );
  const RequestProductScreen = ({ route, ...rest }) => (
    isRetail ? (
      <RetailRequestProduct route={route} {...rest} />
    ) : (
      <RequestProduct route={route} {...rest} />
    )
  );
  const ProfileDetailsScreen = ({ route, ...rest }) => (
    isRetail ? (
      <RetailProfileDetails route={route} {...rest} />
    ) : (
      <ProfileDetails route={route} {...rest} />
    )
  );
  const OrderSuccessScreen = ({ route, ...rest }) => (
    isRetail ? (
      <RetailOrderSuccess route={route} {...rest} />
    ) : (
      <OrderSuccess route={route} {...rest} />
    )
  );
  const CategoryScreen = ({ route, ...rest }) => (
    <CategoryScreenWholesale route={route} {...rest} />
  );
  const WishlistModeScreen = ({ route, ...rest }) => (
    isRetail ? (
      <RetailWishlistScreen route={route} {...rest} />
    ) : (
      <WishlistScreen route={route} {...rest} />
    )
  );
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: "none", // disable page transition animations
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="ShoppingMode" component={ShoppingModeScreen} />

      <Stack.Screen name="HomeTabs" component={TabNavigation} />

      {/* MAIN CATEGORY FLOW */}
      <Stack.Screen name="CategoryNavigator" component={CategoryNavigator} />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="SubCategoryScreen" component={SubCategoryScreen} />
      <Stack.Screen name="RetailSubCategoryScreen" component={RetailSubCategoryScreen} />

      {/* FIX: ADD THIS SCREEN */}
      <Stack.Screen name="ProductListScreen" component={ProductListScreen} />
      <Stack.Screen name="RetailProductListScreen" component={RetailProductListScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="RetailProductDetail" component={RetailProductDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="AddressBook" component={AddressBook} />
      <Stack.Screen name="AddAddress" component={AddAddress} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
      <Stack.Screen name="FAQs" component={FAQScreen} />
      <Stack.Screen name="RequestProduct" component={RequestProductScreen} />
      <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
      <Stack.Screen name="Wishlist" component={WishlistModeScreen} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="OrderSummary" component={OrderSummary} />
      <Stack.Screen name="Support" component={Support} />
      <Stack.Screen name="SupportChat" component={SupportChat} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen
        name="ShippingDeliveryPolicy"
        component={ShippingDeliveryPolicyScreen}
      />
      <Stack.Screen
        name="RefundCancellationPolicy"
        component={RefundCancellationPolicyScreen}
      />
      <Stack.Screen
        name="PaymentPolicy"
        component={PaymentPolicyScreen}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />

      <Stack.Screen name="RegisterStep1" component={RegisterStep1} />
      <Stack.Screen name="RegisterStep2" component={RegisterStep2} />

    </Stack.Navigator>
  );
}
