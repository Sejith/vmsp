import Navbar from "../components/navbar";

const SidebarLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#0b0502] text-gold overflow-hidden">
      <Navbar />

      <main className="flex-1 pl-0.5 bg-[#0b0502] overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;
