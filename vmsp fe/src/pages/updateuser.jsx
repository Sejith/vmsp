import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import bg from "../assets/background_landscape.png";
import { toast } from "react-hot-toast";
import { UpdateUser as UpdateUserAPI } from "../clients/users";

const UpdateUser = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const userData = location.state?.user;

  const [formData, setFormData] = useState({
    id: "",
    username: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    is_admin: false,
    is_active: true,
  });

  useEffect(() => {
    if (!userData) {
      toast.error("No user data found");
      navigate("/admin/find/user");
      return;
    }

    setFormData({
      id: userData.id || "",
      username: userData.username || "",
      first_name: userData.first_name || "",
      last_name: userData.last_name || "",
      phone_number: userData.phone_number || "",
      email: userData.email || "",
      is_admin: userData.is_admin ?? false,
      is_active: userData.is_active ?? true,
    });
  }, [userData, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggle = (name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      await UpdateUserAPI(formData);
      toast.success("User updated successfully");
      navigate("/admin/find/user");
    } catch (err) {
      toast.error(err?.message || "Failed to update user");
      console.error(err);
    }
  };

  return (
    <div
      className="w-full min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <form
        onSubmit={handleUpdate}
        className="w-[85%] max-w-4xl border border-[#D4AF37]/40 rounded-xl p-8 bg-black/70 backdrop-blur-md"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-[#D4AF37]">Update User</h1>
          <hr className="border-[#D4AF37]/40 w-1/3 mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[#D4AF37]">
          <div className="col-span-2">
            <label className="block mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-2 rounded bg-black/50 border border-[#D4AF37]/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-1">First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full p-2 rounded bg-black/50 border border-[#D4AF37]/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-1">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full p-2 rounded bg-black/50 border border-[#D4AF37]/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 rounded bg-black/50 border border-[#D4AF37]/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full p-2 rounded bg-black/50 border border-[#D4AF37]/40 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between border border-[#D4AF37]/40 rounded p-2 bg-black/50">
            <span>Admin</span>
            <input
              type="checkbox"
              checked={formData.is_admin}
              onChange={() => handleToggle("is_admin")}
              className="w-5 h-5"
            />
          </div>

          <div className="flex items-center justify-between border border-[#D4AF37]/40 rounded p-2 bg-black/50">
            <span>Active</span>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={() => handleToggle("is_active")}
              className="w-5 h-5"
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            type="submit"
            className="px-10 py-2 rounded bg-[#D4AF37] text-black font-semibold hover:bg-[#c7a330] transition-all"
          >
            Update User
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateUser;
