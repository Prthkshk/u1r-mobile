import axios from "axios";
import { API_BASE_URL } from "../config/api";

const BASE_URL = `${API_BASE_URL}/api/wholesale`;

export const sendStep1 = async (data) => {
  return axios.post(`${BASE_URL}/step1`, data);
};

export const sendStep2 = async (data) => {
  return axios.post(`${BASE_URL}/step2`, data);
};

export const checkStatus = async (userId) => {
  return axios.get(`${BASE_URL}/status/${userId}`);
};
