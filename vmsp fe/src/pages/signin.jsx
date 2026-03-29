import { useState } from "react";
import { Mail, Lock, Eye, EyeClosed } from "lucide-react";
import bg from "../assets/background_landscape.png";
import { Link } from "react-router-dom";
import { LoginUser } from "../clients/users";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/authcontext";
import { useLocation, useNavigate } from "react-router-dom";

const Signin = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signInData, setSignInData] = useState({
    username: "",
    password: "",
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleChange = (e) => {
    setSignInData({ ...signInData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

      const res = await LoginUser(signInData);

      toast.success(res.message || "Login successful");

      login({
        token: res?.data?.token,
        isAdmin: res?.data?.isAdmin,
        userId: res?.data?.userId,
      });

      const redirectTo =
        new URLSearchParams(location.search).get("redirect") || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err.message || "Login failed");
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
        className="w-[85%] max-w-xl border border-[#D4AF37]/40 rounded-xl p-8 bg-black/70 backdrop-blur-md"
      >
        <input
          type="text"
          name="fakeUsername"
          autoComplete="username"
          className="hidden"
        />
        <input
          type="password"
          name="fakePassword"
          autoComplete="new-password"
          className="hidden"
        />

        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-[#D4AF37]">Sign In</h1>
          <p className="text-[#D4AF37]/80 mt-1">Access your account</p>
          <hr className="border-[#D4AF37]/40 w-1/3 mx-auto mt-2" />
        </div>

        <div className="flex flex-col gap-5 text-[#D4AF37]">
          <div>
            <label className="flex items-center gap-2 mb-1">
              <Mail size={16} />
              Username
            </label>
            <input
              type="text"
              name="username"
              placeholder="Enter your username"
              value={signInData.username}
              onChange={handleChange}
              required
              autoComplete="off"
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
                value={signInData.password}
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
        </div>

        <div className="mt-6 text-center">
          <button
            type="submit"
            disabled={loading}
            className="px-10 py-2 rounded bg-[#D4AF37] text-black font-semibold hover:bg-[#c7a330] transition-all disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </div>

        <div className="text-center text-sm mt-4 text-[#D4AF37]/80">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-[#D4AF37] underline">
            Sign Up
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Signin;
