import axios from "axios";

export const GetProducts = async ({ limit, offset, name, type, token }) => {
  const params = { limit, offset };

  if (name) params.name = name;
  if (type) params.type = type;

  const res = await axios.get(
    `${import.meta.env.VITE_SHOP_BE_URL}/v1/get/products`,
    {
      params,
      headers: token ? { Authorization: `Basic ${token}` } : {},
    },
  );

  return res.data;
};

export const UploadProduct = async (formData, token) => {
  const res = await axios.post(
    `${import.meta.env.VITE_SHOP_BE_URL}/v1/upload/product`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Basic ${token}`,
      },
    },
  );

  return res.data;
};

export const GetProductById = async (id, token) => {
  const res = await axios.get(
    `${import.meta.env.VITE_SHOP_BE_URL}/v1/get/product/${id}`,
    {
      headers: {
        Authorization: `Basic ${token}`,
      },
    },
  );
  return res.data;
};

export const UpdateProductById = async (formData, token) => {
  const res = await axios.post(
    `${import.meta.env.VITE_SHOP_BE_URL}/v1/update/product`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Basic ${token}`,
      },
    },
  );
  return res.data;
};
