import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

export const fetchSupportChat = async (userId) => {
  return axios.get(`${API_BASE}/api/support/chat/${userId}`);
};

export const sendSupportMessage = async ({ userId, text }) => {
  return axios.post(`${API_BASE}/api/support/chat/send`, { userId, text });
};

export const submitSupportCallTicket = async ({ userId, name, phone, problem }) => {
  return axios.post(`${API_BASE}/api/support/call-ticket`, {
    userId,
    name,
    phone,
    problem,
  });
};

