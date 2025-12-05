import axios from "axios";
import { API_BASE_URL } from "../config/api";

const BASE_URL = `${API_BASE_URL}/api/auth`;

export const sendOtp = async (phone) => {
  return await axios.post(`${BASE_URL}/send-otp`, { phone });
};

export const verifyOtp = async (phone, otp) => {
  return await axios.post(`${BASE_URL}/verify-otp`, { phone, otp });
};
