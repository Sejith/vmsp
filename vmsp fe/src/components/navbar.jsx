import React, { useState, useEffect } from "react";
import sidebarBg from "../assets/background_potrait.png";
import logo from "../assets/vmsp_logo.png";
import {
  CircleUserRound as User,
  House,
  ShoppingCart,
  Gem,
  Coins,
  LogOut,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authcontext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNavClick = (item) => {
    const route =
      item.name === "Home"
        ? "/"
        : `/${item.name.replace(/\s+/g, "-").toLowerCase()}`;

    if ((item.name === "Cart" || item.name === "Transactions" || item.name === "Gold" || item.name === "Silver") && !user) {
      navigate(`/signin?redirect=${route}`);
      return;
    }

    navigate(route);
  };

  const handleLogoClick = () => {
    if (user?.isAdmin) {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  const navItems = [
    { name: "Home", icon: <House className="text-gold" /> },
    { name: "Gold", icon: <Coins className="text-gold" /> },
    { name: "Silver", icon: <Gem className="text-gold" /> },
    { name: "Cart", icon: <ShoppingCart className="text-gold" /> },
    { name: "Transactions", icon: <Wallet className="text-gold" /> },
  ];

  return (
    <>
      <div className="md:hidden flex items-center p-2 bg-black text-gold">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-2xl font-bold"
        >
          ☰
        </button>
        <span className="ml-2 font-semibold">VMSP</span>
      </div>

      <aside
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col text-gold transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 md:relative md:w-[300px] w-[300px]`}
        style={{
          backgroundImage: `url(${sidebarBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex flex-col px-4 pt-4 flex-grow">
          <div className="flex flex-row items-center mb-1">
            <img
              src={logo}
              alt="Logo"
              className="cursor-pointer"
              onClick={handleLogoClick}
            />
          </div>

          <hr className="border-gold/50 my-1" />

          <div className="flex flex-col gap-1 mb-1 text-sm">
            {!user ? (
              <span
                onClick={() => navigate("/signin")}
                className="hover:text-yellow-400 text-center cursor-pointer"
              >
                Sign In | Register
              </span>
            ) : (
              <div className="w-full flex justify-between">
                <div className="flex items-center gap-2">
                  <User size={50} />
                  <div className="flex flex-col font-semibold text-lg">
                    <span>Hello,</span>
                    <span>{atob(user?.token || "").split(":")[0]}</span>
                  </div>
                </div>

                <div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-sm hover:text-yellow-400 mt-8"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          <hr className="border-gold/50 my-1" />

          <nav className="flex flex-col">
            {navItems.map((item, idx) => (
              <div key={idx}>
                <button
                  onClick={() => handleNavClick(item)}
                  className="
                    flex items-center gap-3 
                    px-4 py-2 w-full
                    text-sm text-gold
                    transition-all duration-300
                    hover:text-black
                    hover:bg-gradient-to-r 
                    hover:from-[#8F6B1A] 
                    hover:via-[#D4AF37] 
                    hover:to-[#8F6B1A]
                    hover:rounded-lg
                  "
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>

                {idx !== navItems.length - 1 && (
                  <hr className="border-gold/50" />
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="px-4 pb-3 mt-auto text-xs flex flex-col gap-1">
          <hr className="border-gold/50 my-1" />

          <div className="flex flex-col md:flex-row gap-2 items-start">
            <div className="flex-1">
              <p className="font-semibold">{import.meta.env.VITE_SHOP_NAME}</p>
              <p>{import.meta.env.VITE_SHOP_ADDRESS}</p>
              <p>Phone: +91 {import.meta.env.VITE_SHOP_MOBILE}</p>
              <p>Email: {import.meta.env.VITE_SHOP_EMAIL}</p>
              <p>Mon - Sat: {import.meta.env.VITE_SHOP_TIMINGS_NORMAL}</p>
              <p>Sun: {import.meta.env.VITE_SHOP_TIMINGS_SUNDAY}</p>
            </div>

            <div className="w-full md:w-[120px] h-[80px] rounded overflow-hidden border border-gold/50">
              <iframe
                title="Shop Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d139026.43517957113!2d79.82204903956377!3d14.33260787190052!2m3!1f0!2f0!3f0!2m3!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4c8ccf3959e161%3A0x758862fcb546993a!2sSri%20Venkata%20Madhava%20Silver%20Palace!5e1!3m2!1sen!2sin!4v1769965881852!5m2!1sen!2si"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
              ></iframe>
            </div>
          </div>

          <div className="border-t border-gold/50 mt-1 pt-1 text-center">
            © 2024 - {new Date().getFullYear()} VMSP. All rights reserved.
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Navbar;
