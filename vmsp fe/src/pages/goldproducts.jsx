import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import bg from "../assets/background_landscape.png";
import Loader from "../components/loader";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/authcontext";
import { GetProducts } from "../clients/product";
import { UpdateCart } from "../clients/cart";

const LIMIT = 8;

const GoldProducts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [addedToCart, setAddedToCart] = useState({});

  const offsetRef = useRef(0);
  const hasNextRef = useRef(true);
  const loadingRef = useRef(false);
  const searchNameRef = useRef("");
  const observerRef = useRef(null);

  const fetchProducts = useCallback(
    async (reset = false) => {
      if (loadingRef.current) return;
      if (!reset && !hasNextRef.current) return;

      try {
        loadingRef.current = true;
        setLoading(true);

        const currentOffset = reset ? 0 : offsetRef.current;

        const data = await GetProducts({
          limit: LIMIT,
          offset: currentOffset,
          name: searchNameRef.current || null,
          type: "gold",
          token: user?.token,
        });

        if (!data?.is_success) {
          hasNextRef.current = false;
          setHasNext(false);
          return;
        }

        if (reset) {
          setProducts(data.products || []);
          offsetRef.current = LIMIT;
        } else {
          setProducts((prev) => [...prev, ...(data.products || [])]);
          offsetRef.current = offsetRef.current + LIMIT;
        }

        hasNextRef.current = data.has_next;
        setHasNext(data.has_next);
      } catch (err) {
        toast.error("Failed to fetch products");
        hasNextRef.current = false;
        setHasNext(false);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    fetchProducts(true);
  }, [fetchProducts]);

  const handleSearch = () => {
    searchNameRef.current = searchName;
    offsetRef.current = 0;
    hasNextRef.current = true;
    fetchProducts(true);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextRef.current &&
          !loadingRef.current
        ) {
          fetchProducts(false);
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0,
      },
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
      observer.disconnect();
    };
  }, [fetchProducts]);

  const handleAddToCart = async (productId) => {
    if (!user) {
      toast.error("Please sign in to add products to cart");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    try {
      await UpdateCart(user.userId, productId, "INC", user.token);

      setAddedToCart((prev) => ({ ...prev, [productId]: true }));
      toast.success("Product added to cart");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to add to cart");
    }
  };

  const ProductCard = ({ item }) => {
    const product = item.product;
    const price = item.price;

    const images = [
      product.image1,
      product.image2,
      product.image3,
      product.image4,
      product.image5,
    ].filter(Boolean);

    const [index, setIndex] = useState(0);

    return (
      <div className="bg-black/70 border border-[#D4AF37]/40 rounded-xl p-4 text-[#D4AF37] flex flex-col">
        <div className="relative w-full aspect-square overflow-hidden rounded-lg mb-3">
          <img
            src={images[index]}
            alt={product.name}
            className="w-full h-full object-cover"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={() =>
                  setIndex((prev) =>
                    prev === 0 ? images.length - 1 : prev - 1,
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 px-2 rounded"
              >
                ‹
              </button>
              <button
                onClick={() => setIndex((prev) => (prev + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 px-2 rounded"
              >
                ›
              </button>
            </>
          )}
        </div>

        <h2 className="text-lg font-semibold truncate">{product.name}</h2>
        <p className="text-sm opacity-70 mb-1">{product.weight}g</p>
        <p className="text-sm opacity-70 mb-3 line-clamp-2">
          {product.description}
        </p>
        <p className="text-xl font-bold mb-3">₹ {price.toLocaleString()}</p>

        <button
          disabled={addedToCart[product.id]}
          onClick={() => handleAddToCart(product.id)}
          className={`mt-auto py-2 rounded font-semibold ${
            addedToCart[product.id]
              ? "bg-green-600 text-white cursor-not-allowed"
              : "bg-[#D4AF37] text-black"
          }`}
        >
          {addedToCart[product.id] ? "Added to Cart" : "Add to Cart"}
        </button>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center p-6"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by product name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 p-2 rounded bg-black/60 border border-[#D4AF37]/40 text-[#D4AF37]"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-[#D4AF37] text-black rounded font-semibold"
          >
            Search
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((item) => (
            <ProductCard key={item.product.id} item={item} />
          ))}
        </div>

        <div ref={observerRef} className="mt-6">
          {loading && <Loader size="md" text="Loading products..." />}
          {!loading && !hasNext && products.length > 0 && (
            <p className="text-center text-[#D4AF37]/70 mt-4">
              No more products
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoldProducts;