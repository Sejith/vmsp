import React, { useState, useEffect } from "react";
import bg from "../assets/background_landscape.png";
import { toast } from "react-hot-toast";
import { GetCart, UpdateCart } from "../clients/cart";
import { useAuth } from "../context/authcontext";
import Loader from "../components/loader";
import { AddTransaction } from "../clients/transactions";

const paymentMethods = ["Credit / Debit Card", "UPI / Net Banking", "Cash"];

const Cart = () => {
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await GetCart(user.userId, user.token);
      setCartData(data);
    } catch (err) {
      setCartData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = async (productId, type) => {
    try {
      setUpdatingId(productId);
      const action = type === "inc" ? "INC" : "DEC";
      await UpdateCart(user.userId, productId, action, user.token);
      await fetchCart();
    } catch (err) {
      toast.error(err.message || "Failed to update cart");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (productId) => {
    try {
      setUpdatingId(productId);
      await UpdateCart(user.userId, productId, "REMOVE", user.token);
      await fetchCart();
      toast.success("Item removed from cart");
    } catch (err) {
      toast.error(err.message || "Failed to remove item");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBuy = () => {
    if (!cartData?.items?.length) {
      toast.error("Your cart is empty");
      return;
    }
    setShowModal(true);
  };

  const confirmPurchase = async () => {
    try {
      if (!cartData || !user) return;

      const transactionPayload = {
        user_id: user.userId,
        mode_of_payment: selectedPayment,
        items: cartData.items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      };

      const response = await AddTransaction(transactionPayload, user.token);
      toast.success("Purchase completed successfully!");
    } catch (error) {
      toast.error("Purchase failed. Please try again.");
    }
  };

  return (
    <div
      className="w-full min-h-screen bg-cover bg-center p-6"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="max-w-6xl mx-auto bg-black/70 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl p-6 text-[#D4AF37]">
        <h1 className="text-3xl font-semibold text-center mb-2">
          Shopping Cart
        </h1>

        <p className="text-center text-sm mb-4">
          You have {cartData?.items?.length || 0} items in your cart. &nbsp;
          <span className="text-[#c7a330]">Cart Limit: 25</span>
        </p>

        {loading && (
          <div className="min-h-[300px] flex items-center justify-center">
            <Loader size="lg" text="Fetching your cart..." />
          </div>
        )}

        {!loading && cartData?.items?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cartData.items.map((item) => {
              const outOfStock = !item.product.is_available;

              return (
                <div
                  key={item?.product?.id}
                  className="border border-[#D4AF37]/40 rounded-lg p-4 bg-black/60 relative"
                >
                  {outOfStock && (
                    <span className="absolute top-2 right-2 bg-red-700 text-white text-xs px-2 py-1 rounded">
                      Out of Stock
                    </span>
                  )}

                  <img
                    src={item?.product?.image1}
                    alt={item?.product?.name}
                    className="w-full aspect-square object-cover rounded-md mb-3"
                  />

                  <h3 className="text-lg font-semibold">
                    {item?.product?.name}
                  </h3>
                  <p className="text-sm text-[#D4AF37]/80 mb-2">
                    {item?.product?.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 border border-[#D4AF37]/40 rounded px-2 py-1">
                      <button
                        disabled={updatingId === item.product.id || outOfStock}
                        onClick={() => handleQtyChange(item.product.id, "dec")}
                        className="px-2 disabled:opacity-50"
                      >
                        -
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        disabled={updatingId === item.product.id || outOfStock}
                        onClick={() => handleQtyChange(item.product.id, "inc")}
                        className="px-2 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-semibold">₹ {item.item_total}</span>
                  </div>

                  <button
                    disabled={updatingId === item.product.id}
                    onClick={() => removeItem(item.product.id)}
                    className="w-full py-2 rounded bg-red-800/80 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {updatingId === item.product.id ? "Updating..." : "Remove"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-col md:flex-row items-center justify-between">
          <h2 className="text-xl font-semibold">
            Total: ₹ {cartData?.total_amount}
          </h2>

          <button
            onClick={handleBuy}
            className="mt-3 md:mt-0 px-6 py-2 rounded bg-[#D4AF37] text-black font-semibold hover:bg-[#c7a330]"
          >
            Proceed to Buy →
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-black border border-[#D4AF37]/40 rounded-xl p-6 w-[90%] max-w-md text-[#D4AF37]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Select Payment Method</h2>
              <button onClick={() => setShowModal(false)} className="text-xl">
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {paymentMethods.map((method) => (
                <label
                  key={method}
                  className={`flex items-center gap-3 border border-[#D4AF37]/40 p-3 rounded cursor-pointer ${
                    selectedPayment === method
                      ? "bg-[#D4AF37]/20"
                      : "bg-black/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method}
                    checked={selectedPayment === method}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                  />
                  {method}
                </label>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-[#D4AF37]/40 rounded"
              >
                Cancel
              </button>

              <button
                onClick={confirmPurchase}
                className="px-4 py-2 bg-[#D4AF37] text-black rounded font-semibold"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
