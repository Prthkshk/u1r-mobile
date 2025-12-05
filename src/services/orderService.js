import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

export const fetchOrders = async (userId) => {
  if (!userId) throw new Error("userId required");
  return axios.get(`${API_BASE}/api/orders/list/${userId}`);
};

export const cancelOrder = async (orderId) => {
  if (!orderId) throw new Error("orderId required");
  return axios.post(`${API_BASE}/api/orders/cancel`, { orderId });
};

export const fetchOrderDetails = async (orderId) => {
  if (!orderId) throw new Error("orderId required");
  return axios.get(`${API_BASE}/api/orders/details/${orderId}`);
};
