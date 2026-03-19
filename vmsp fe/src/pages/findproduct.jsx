import React, { useState } from "react";
import { toast } from "react-hot-toast";
import bg from "../assets/background_landscape.png";
import { GetProductById } from "../clients/product";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authcontext";

const FindProduct = () => {
  const [productId, setProductId] = useState("");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!productId) {
      toast.error("Enter a Product ID");
      return;
    }

    setLoading(true);
    setProduct(null);

    try {
      const res = await GetProductById(productId, user.token);
      setProduct(res.product);
      toast.success("Product found");
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error("Product not found");
      } else {
        toast.error(err?.message || "Error fetching product");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="max-w-3xl border border-[#D4AF37]/40 rounded-xl p-8 bg-black/70 backdrop-blur-md text-[#D4AF37]">
        <h1 className="text-center text-3xl font-semibold mb-6">
          Find Product
        </h1>

        <div className="flex justify-center mb-6">
          <input
            type="text"
            placeholder="Enter Product ID"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-2/3 p-2 rounded-l bg-black/50 border border-[#D4AF37]/40 focus:outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-[#D4AF37] text-black font-semibold rounded-r hover:bg-[#c7a330] disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {product && (
          <div className="border border-[#D4AF37]/40 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 border-b border-[#D4AF37]/40 pb-2">
              Product Details
            </h2>

            <p>
              <strong>Name:</strong> {product.name}
            </p>

            <p>
              <strong>Description:</strong> {product.description}
            </p>

            <p>
              <strong>Price:</strong> ₹{product.price}
            </p>

            <p>
              <strong>Available:</strong>{" "}
              {product.is_available ? "Yes" : "No"}
            </p>

            <p className="mt-1">
              <strong>Status:</strong>{" "}
              <span
                className={
                  product.is_available
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {product.is_available ? "Active" : "Inactive"}
              </span>
            </p>

            {product.image1 && (
              <div className="mt-4 flex justify-center">
                <img
                  src={product.image1}
                  alt="Product"
                  className="w-32 h-32 object-cover rounded-lg border border-[#D4AF37]/40"
                />
              </div>
            )}

            <button
              onClick={() =>
                navigate("/admin/update/product", {
                  state: { product },
                })
              }
              className="mt-6 px-6 py-2 rounded bg-[#D4AF37] text-black font-semibold hover:bg-[#c7a330]"
            >
              Edit Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindProduct;
