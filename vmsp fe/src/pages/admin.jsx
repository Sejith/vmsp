import { useNavigate } from "react-router-dom";
import bg from "../assets/background_landscape.png";
import { Search, Receipt, PackagePlus, SquarePen } from "lucide-react";

const AdminPanel = () => {
  const navigate = useNavigate();

  const options = [
    {
      title: "Search User",
      icon: <Search size={40} className="text-[#D4AF37]" />,
      route: "/admin/find/user",
    },
    {
      title: "Transactions",
      icon: <Receipt size={40} className="text-[#D4AF37]" />,
      route: "/admin/transactions",
    },
    {
      title: "Add Product",
      icon: <PackagePlus size={40} className="text-[#D4AF37]" />,
      route: "/admin/add/product",
    },
    {
      title: "Edit Product",
      icon: <SquarePen size={40} className="text-[#D4AF37]" />,
      route: "/admin/find/product",
    },
  ];

  return (
    <div
      className="w-full min-h-screen bg-cover bg-center p-6 flex items-center justify-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="max-w-4xl w-full bg-black/70 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl p-8 text-[#D4AF37]">
        <h1 className="text-3xl font-semibold text-center tracking-wide mb-2">
          ADMIN PANEL
        </h1>

        <p className="text-center text-sm mb-8 text-[#c7a330]">
          Please select an option
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {options.map((opt) => (
            <div
              key={opt.title}
              onClick={() => navigate(opt.route)}
              className="
                cursor-pointer 
                border border-[#D4AF37]/40 
                rounded-xl 
                bg-black/60 
                p-8 
                flex 
                flex-col 
                items-center 
                gap-4
                transition-all 
                hover:scale-105 
                hover:bg-black/80
                hover:border-[#D4AF37]
              "
            >
              {opt.icon}
              <h2 className="text-xl font-semibold">{opt.title}</h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
