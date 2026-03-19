import React, { useState, useEffect } from "react";
import bg from "../assets/background_landscape.png";
import { UpdateProductById } from "../clients/product";
import { useAuth } from "../context/authcontext";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Loader from "../components/loader";

const PRODUCT_TYPES = ["gold", "silver"];

const UpdateProduct = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product;

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    weight: "",
    is_available: true,
    type: "",
  });

  const [images, setImages] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    image5: null,
  });

  const [previews, setPreviews] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    image5: null,
  });

  useEffect(() => {
    if (!product) {
      navigate("/admin/find/product");
      return;
    }

    setForm({
      name: product.name || "",
      description: product.description || "",
      weight: product.weight || "",
      is_available: product.is_available ?? true,
      type: product.type || "",
    });

    setPreviews({
      image1: product.image1 || null,
      image2: product.image2 || null,
      image3: product.image3 || null,
      image4: product.image4 || null,
      image5: product.image5 || null,
    });
  }, [product, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      if (img.width !== img.height) {
        toast.error("Image must be square (width and height equal)");
        return;
      }

      setImages((prev) => ({ ...prev, [key]: file }));
      setPreviews((prev) => ({ ...prev, [key]: img.src }));
    };
  };

  const handleSubmit = async () => {
    if (!form.name || !form.weight) {
      toast.error("Name and weight are required");
      return;
    }

    if (!form.type) {
      toast.error("Please select a product type");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("id", product.id);
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("weight", form.weight);
      formData.append("is_available", form.is_available);
      formData.append("type", form.type);

      Object.keys(images).forEach((key) => {
        if (images[key]) {
          formData.append(key, images[key]);
        }
      });

      const res = await UpdateProductById(formData, user.token);
      toast.success(res.message || "Product updated successfully");

      navigate("/admin/find/product");
    } catch (err) {
      toast.error("Failed to update product");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full min-h-screen bg-cover bg-center p-6"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="max-w-4xl mx-auto bg-black/70 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl p-6 text-[#D4AF37]">
        <h1 className="text-3xl font-semibold text-center mb-4">
          Update Product
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            placeholder="Product Name"
            value={form.name}
            onChange={handleChange}
            className="p-2 rounded bg-black/60 border border-[#D4AF37]/40 outline-none"
          />

          <input
            name="weight"
            placeholder="Weight (grams)"
            value={form.weight}
            onChange={handleChange}
            className="p-2 rounded bg-black/60 border border-[#D4AF37]/40 outline-none"
          />

          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="p-2 rounded bg-black/60 border border-[#D4AF37]/40 outline-none text-[#D4AF37]"
          >
            <option value="" disabled>Select Type</option>
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t} className="bg-black text-[#D4AF37] capitalize">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={() =>
                setForm((p) => ({ ...p, is_available: !p.is_available }))
              }
            />
            <span>Available</span>
          </div>

          <textarea
            name="description"
            placeholder="Description (max 50 characters)"
            value={form.description}
            onChange={handleChange}
            maxLength={50}
            className="p-2 rounded bg-black/60 border border-[#D4AF37]/40 outline-none md:col-span-2 resize-none"
            rows={4}
          />

          <div className="text-right text-xs text-[#D4AF37]/70 md:col-span-2">
            {form.description.length}/50 characters
          </div>
        </div>

        <h2 className="mt-6 mb-2 font-semibold">
          Replace Images (Square Only)
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              {previews[`image${i}`] ? (
                <img
                  src={previews[`image${i}`]}
                  alt={`preview ${i}`}
                  className="w-32 h-32 object-cover border border-[#D4AF37]/40 rounded"
                />
              ) : (
                <div className="w-32 h-32 border border-[#D4AF37]/40 flex items-center justify-center text-sm">
                  Image {i}
                </div>
              )}

              <label className="cursor-pointer bg-black/60 border border-[#D4AF37]/40 text-[#D4AF37] px-3 py-1 rounded text-xs hover:bg-[#D4AF37]/20">
                Replace
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, `image${i}`)}
                  className="hidden"
                />
              </label>
            </div>
          ))}
        </div>

        {loading ? (
          <Loader size="md" text="Updating product..." />
        ) : (
          <button
            onClick={handleSubmit}
            className="mt-6 w-full py-2 bg-[#D4AF37] text-black font-semibold rounded hover:bg-[#c7a330]"
          >
            Update Product
          </button>
        )}
      </div>
    </div>
  );
};

export default UpdateProduct;