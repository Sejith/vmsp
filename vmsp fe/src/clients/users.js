import axios from "axios";

export const RegisterUser = async (userData) => {
  const response = await axios.post(
    `${import.meta.env.VITE_SHOP_BE_URL}/v1/signup`,
    userData,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  const data = response.data;

  localStorage.setItem(
    "user",
    JSON.stringify({
      token: data.token,
      isAdmin: data.isAdmin,
      userId: data.userId,
    }),
  );

  return data;
};

export const LoginUser = async (credentials) => {
  const response = await axios.post(
    `${import.meta.env.VITE_SHOP_BE_URL}/v1/login`,
    credentials,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  const data = response.data;

  localStorage.setItem(
    "user",
    JSON.stringify({
      token: data.token,
      isAdmin: data.isAdmin,
      userId: data.userId,
    }),
  );

  return data;
};

export const FindUserByPhone = async (phoneNumber) => {
  const response = await axios.get(
    `${import.meta.env.VITE_SHOP_BE_URL}/v1/get/user?phoneNumber=${phoneNumber}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${JSON.parse(localStorage.getItem("user"))?.token}`,
      },
    },
  );

  return response.data;
};

export const UpdateUser = async (userData) => {
  const response = await axios.post(
    `${import.meta.env.VITE_SHOP_BE_URL}/v1/update/user`,
    userData,
    {
      headers: {
        "content-type": "application/json",
        Authorization: `Basic ${JSON.parse(localStorage.getItem("user"))?.token}`,
      },
    },
  );

  return response.data;
};
