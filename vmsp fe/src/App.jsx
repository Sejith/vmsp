import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import About from "./pages/about";
import Signup from "./pages/signup";
import Signin from "./pages/signin";
import AdminPanel from "./pages/admin";
import FindUser from "./pages/finduser";
import UpdateUser from "./pages/updateuser";
import AdminTransactions from "./pages/admintransactions";
import AddProduct from "./pages/addproduct";
import Cart from "./pages/cart";
import SidebarLayout from "./layout/sidebar";
import { preloadImages } from "./utils";
import sidebarBg from "./assets/background_potrait.png";
import pageBg from "./assets/background_landscape.png";
import logo from "./assets/vmsp_logo.png";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/authcontext";
import AdminUpdateProductForm from "./pages/updateproduct";
import FindProduct from "./pages/findproduct";
import UserTransactions from "./pages/usertransactions";
import GoldProducts from "./pages/goldproducts";
import SilverProducts from "./pages/silverproducts";

function App() {
  useEffect(() => {
    preloadImages([sidebarBg, pageBg, logo]);
  }, []);
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#000",
              color: "#D4AF37",
              border: "1px solid #D4AF37",
            },
          }}
        />
        <SidebarLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/find/user" element={<FindUser />} />
            <Route path="/admin/update/user" element={<UpdateUser />} />
            <Route path="/admin/transactions" element={<AdminTransactions />} />
            <Route path="/admin/add/product" element={<AddProduct />} />
            <Route path="/admin/find/product" element={<FindProduct />} />
            <Route
              path="/admin/update/product"
              element={<AdminUpdateProductForm />}
            />
            <Route path="/cart" element={<Cart />} />
            <Route path="/transactions" element={<UserTransactions />} />
            <Route path="/gold" element={<GoldProducts />} />
            <Route path="/silver" element={<SilverProducts />} />
          </Routes>
        </SidebarLayout>
      </Router>
    </AuthProvider>
  );
}

export default App;
