import axios from "axios";

export const GetAdminTransactions = async (offset, limit, searchId, token) => {
  const params = {
    offset,
    limit,
  };
  if (searchId) {
    params.transactionId = searchId;
  }

  const res = await axios.get(
    `${import.meta.env.VITE_SHOP_BE_URL}/v1/get/admin/transactions`,
    {
      params,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
    },
  );
  return res.data;
};

export const AddTransaction = async (transctionData, token) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_SHOP_BE_URL}/v1/add/transactions`,
      transctionData,
      {
        headers: {
          Authorization: `Basic ${token}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const UpdateTransaction = async ({
  transactionId,
  status,
  discount,
  token,
}) => {
  const response = await axios.post(
    `${import.meta.env.VITE_SHOP_BE_URL}/v1/update/transactions`,
    {},
    {
      params: {
        transactionId: transactionId,
        status: status,
        discount: discount,
      },
      headers: {
        Authorization: `Basic ${token}`,
      },
    },
  );

  return response.data;
};

export const GetTransactions = async ({
  limit,
  offset,
  username,
  startDate,
  endDate,
  today,
  token,
}) => {
  const res = await axios.get(
    `${import.meta.env.VITE_SHOP_BE_URL}/v1/get/transactions`,
    {
      params: {
        limit,
        offset,
        username,
        startDate,
        endDate,
        today,
      },
      headers: {
        Authorization: `Basic ${token}`,
      },
    }
  );

  return res.data;
};