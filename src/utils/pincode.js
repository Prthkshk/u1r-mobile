import axios from "axios";

export const fetchCityStateByPincode = async (pincode) => {
  const pin = (pincode || "").trim();
  if (pin.length !== 6) return null;
  try {
    const res = await axios.get(`https://api.postalpincode.in/pincode/${pin}`);
    const office = res?.data?.[0]?.PostOffice?.[0];
    if (!office) return null;
    return {
      city: office.District || "",
      state: office.State || "",
    };
  } catch (err) {
    return null;
  }
};
