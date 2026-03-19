import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import bg from "../assets/background_landscape.png";
import { FindUserByPhone } from "../clients/users";
import { useNavigate } from "react-router-dom";

const FindUser = () => {
  const [phone, setPhone] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const handleSearch = async () => {
    if (!phone) {
      toast.error("Enter a phone number");
      return;
    }

    setLoading(true);
    setUser(null);

    try {
      const res = await FindUserByPhone(phone);
      setUser(res.user);
      toast.success("User found");
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error("User not found");
      } else {
        toast.error(err?.message || "Error fetching user");
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
        <h1 className="text-center text-3xl font-semibold mb-6">Find User</h1>

        <div className="flex justify-center mb-6">
          <input
            type="tel"
            placeholder="Enter Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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

        {user && (
          <div className="border border-[#D4AF37]/40 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 border-b border-[#D4AF37]/40 pb-2">
              User Details
            </h2>

            <p>
              <strong>Username:</strong> {user.username}
            </p>
            <p>
              <strong>Full Name:</strong> {user.first_name} {user.last_name}
            </p>
            <p>
              <strong>Phone Number:</strong> {user.phone_number}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Admin:</strong> {user.is_active ? "Yes" : "No"}
            </p>
            <p className="mt-1">
              <strong>Status:</strong>{" "}
              <span className="text-green-400">
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </p>

            <button onClick={() => navigate("/admin/update/user", { state: { user } })} className="mt-4 px-6 py-2 rounded bg-[#D4AF37] text-black font-semibold hover:bg-[#c7a330]">
              Edit User
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindUser;
