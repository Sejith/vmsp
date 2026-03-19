import React, { useState } from "react";
import { User, Lock, Mail, Phone, Eye, EyeClosed } from "lucide-react";
import bg from "../assets/background_landscape.png";
import { RegisterUser } from "../clients/users";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/authcontext";
import { useLocation, useNavigate } from "react-router-dom";

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signUpData, setSignUpData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    phone_number: "",
    email: "",
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleChange = (e) => {
    setSignUpData({ ...signUpData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...signUpData,
        is_admin: false,
        is_active: true,
      };

      const res = await RegisterUser(payload);
      toast.success(res.message || "Signup successful!");

      login({
        token: res?.data?.token,
        isAdmin: res?.data?.isAdmin,
        userId: res?.data?.userId,
      });

      const redirectTo =
        new URLSearchParams(location.search).get("redirect") || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="w-[85%] max-w-4xl border border-[#D4AF37]/40 rounded-xl p-8 bg-black/70 backdrop-blur-md"
      >
        <input
          type="text"
          name="fakeUsername"
          autoComplete="username"
          style={{ display: "none" }}
        />
        <input
          type="password"
          name="fakePassword"
          autoComplete="new-password"
          style={{ display: "none" }}
        />

        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-[#D4AF37]">Sign Up</h1>
          <p className="text-[#D4AF37]/80 mt-1">Create your account</p>
          <hr className="border-[#D4AF37]/40 w-1/3 mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[#D4AF37]">
          <div className="col-span-2">
            <label className="flex items-center gap-2 mb-1">
              <User size={16} /> Username
            </label>
            <input
              type="text"
              name="username"
              placeholder="Enter your username"
              value={signUpData.username}
              onChange={handleChange}
              required
              autoComplete="new-password"
              data-lpignore="true"
              className="w-full p-2 rounded bg-black/50 border border-[#D4AF37]/40 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-1">
              <User size={16} /> First Name
            </label>
            <input
              type="text"
              name="first_name"
              placeholder="Enter your first name"
              value={signUpData.first_name}
              onChange={handleChange}
              required
              autoComplete="new-password"
              data-lpignore="true"
              className="w-full p-2 rounded bg-black/50 border border-[#D4AF37]/40 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-1">
              <User size={16} /> Last Name
            </label>
            <input
              type="text"
              name="last_name"
              placeholder="Enter your last name"
              value={signUpData.last_name}
              onChange={handleChange}
              required
              autoComplete="new-password"
              data-lpignore="true"
              className="w-full p-2 rounded bg-black/50 border border-[#D4AF37]/40 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-2 mb-1">
              <Lock size={16} /> Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={signUpData.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
                data-lpignore="true"
                className="w-full p-2 pr-10 rounded bg-black/50 border border-[#D4AF37]/40 focus:outline-none focus:border-[#D4AF37]"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4AF37] hover:opacity-80"
              >
                {showPassword ? <EyeClosed size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 mb-1">
              <Mail size={16} /> Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={signUpData.email}
              onChange={handleChange}
              required
              autoComplete="new-password"
              data-lpignore="true"
              className="w-full p-2 rounded bg-black/50 border border-[#D4AF37]/40 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-1">
              <Phone size={16} /> Phone Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value="+91"
                className="w-16 p-2 rounded bg-black/50 border border-[#D4AF37]/40 text-center focus:outline-none focus:border-[#D4AF37]"
                readOnly
              />
              <input
                type="tel"
                name="phone_number"
                placeholder="Enter phone number"
                value={signUpData.phone_number}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                title="Enter a valid 10-digit number"
                autoComplete="new-password"
                data-lpignore="true"
                className="w-full p-2 rounded bg-black/50 border border-[#D4AF37]/40 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            type="submit"
            disabled={loading}
            className="px-10 py-2 rounded bg-[#D4AF37] text-black font-semibold hover:bg-[#c7a330] transition-all disabled:opacity-50"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </div>

        <div className="text-center text-sm mt-4 text-[#D4AF37]/80">
          Already have an account?{" "}
          <Link to="/signin" className="text-[#D4AF37] underline">
            Sign In
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Signup;
