const Loader = ({ size = "md", text = "Loading..." }) => {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-4",
    lg: "w-14 h-14 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div
        className={`${sizeClasses[size]} border-[#D4AF37] border-t-transparent rounded-full animate-spin`}
      ></div>
      {text && (
        <span className="text-[#D4AF37] text-sm tracking-wide">{text}</span>
      )}
    </div>
  );
};

export default Loader;
