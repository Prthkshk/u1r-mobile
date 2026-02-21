import React from "react";
import MyOrders from "../wholesale/MyOrders";

export default function RetailMyOrders(props) {
  return <MyOrders {...props} modeOverride="retail" />;
}
