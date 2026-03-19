import axios from "axios";

export const GetCart = async (userId, token) => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_SHOP_BE_URL}/v1/get/cart`,
      {
        params: {
          userId: userId,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${token}`,
        },
      },
    );

    return res.data;
  } catch (err) {
    throw err;
  }
};

export const UpdateCart = async (userId, productId, action, token) => {
  return axios.post(
    `${import.meta.env.VITE_SHOP_BE_URL}/v1/update/cart`,
    null,
    {
      params: { userId, productId, action },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
    },
  );
};
