import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

export const selectMode = async ({ userId, mode }) => {
  return axios.post(`${API_BASE}/api/user/select-mode`, { userId, mode });
};

export const getProfile = async (userId) => {
  return axios.get(`${API_BASE}/api/user/profile/${userId}`);
};

export const deleteAccount = async (userId) => {
  return axios.post(`${API_BASE}/api/delete-account`, { userId });
};
