import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

export const getNotifications = async (userId) => {
  if (!userId) return [];
  const res = await axios.get(`${API_BASE}/api/notifications/${userId}`);
  return Array.isArray(res.data) ? res.data : [];
};

export const markNotificationRead = async (notificationId) => {
  if (!notificationId) return;
  await axios.post(`${API_BASE}/api/notifications/mark-read`, { notificationId });
};

export const deleteNotification = async (notificationId) => {
  if (!notificationId) return;
  await axios.post(`${API_BASE}/api/notifications/delete`, { notificationId });
};
