import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

export const selectMode = async ({ userId, mode, phone }) => {
  return axios.post(`${API_BASE}/api/user/select-mode`, { userId, mode, phone });
};

export const getProfile = async (userId) => {
  return axios.get(`${API_BASE}/api/user/profile/${userId}`);
};

export const updateProfile = async (userId, payload) => {
  return axios.put(`${API_BASE}/api/user/profile/${userId}`, payload);
};

export const deleteAccount = async (userId) => {
  return axios.post(`${API_BASE}/api/delete-account`, { userId });
};
