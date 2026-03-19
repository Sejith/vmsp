import React, { useEffect, useState, useRef, useCallback } from "react";
import bg from "../assets/background_landscape.png";
import Loader from "../components/loader";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/authcontext";
import {
  GetAdminTransactions,
  UpdateTransaction,
} from "../clients/transactions";

const LIMIT = 10;

const AdminTransactions = () => {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [discountPrice, setDiscountPrice] = useState("");
  const [updating, setUpdating] = useState(false);

  const offsetRef = useRef(0);
  const totalCountRef = useRef(0);
  const loadingRef = useRef(false);
  const hasErrorRef = useRef(false);
  const searchIdRef = useRef("");

  const observerRef = useRef(null);

  const fetchTransactions = useCallback(
    async (reset = false) => {
      if (loadingRef.current) return;
      if (hasErrorRef.current) return;
      if (
        !reset &&
        totalCountRef.current > 0 &&
        offsetRef.current >= totalCountRef.current
      )
        return;

      try {
        loadingRef.current = true;
        setLoading(true);
        setHasError(false);

        const data = await GetAdminTransactions(
          reset ? 0 : offsetRef.current,
          LIMIT,
          searchIdRef.current || null,
          user?.token,
        );

        const fetched = data.transactions || [];
        const count = data.total_count || 0;

        if (reset) {
          setTransactions(fetched);
          offsetRef.current = fetched.length;
        } else {
          setTransactions((prev) => [...prev, ...fetched]);
          offsetRef.current = offsetRef.current + fetched.length;
        }

        totalCountRef.current = count;
        setTotalCount(count);
      } catch (err) {
        toast.error("Failed to fetch transactions");
        hasErrorRef.current = true;
        setHasError(true);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    fetchTransactions(true);
  }, [fetchTransactions]);

  const handleSearch = () => {
    searchIdRef.current = searchId;
    offsetRef.current = 0;
    totalCountRef.current = 0;
    hasErrorRef.current = false;
    setHasError(false);
    fetchTransactions(true);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loadingRef.current &&
          !hasErrorRef.current &&
          offsetRef.current < totalCountRef.current
        ) {
          fetchTransactions(false);
        }
      },
      { threshold: 1 },
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
      observer.disconnect();
    };
  }, [fetchTransactions]);

  const handleUpdateTransaction = async (status, txn) => {
    if (status === "SUCCESS") {
      setSelectedTxn(txn);
      setShowModal(true);
      return;
    }

    try {
      setUpdating(true);

      await UpdateTransaction({
        transactionId: txn._id,
        status: "FAILED",
        discount: 0,
        token: user?.token,
      });

      toast.success("Transaction marked as FAILED");

      offsetRef.current = 0;
      totalCountRef.current = 0;
      hasErrorRef.current = false;
      fetchTransactions(true);
    } catch (err) {
      toast.error("Failed to update transaction");
    } finally {
      setUpdating(false);
    }
  };

  const confirmSuccessUpdate = async () => {
    try {
      setUpdating(true);

      await UpdateTransaction({
        transactionId: selectedTxn?._id,
        status: "SUCCESS",
        discount: Number(discountPrice),
        token: user?.token,
      });

      toast.success("Transaction marked as SUCCESS");

      setShowModal(false);
      setDiscountPrice("");
      setSelectedTxn(null);

      offsetRef.current = 0;
      totalCountRef.current = 0;
      hasErrorRef.current = false;
      fetchTransactions(true);
    } catch (err) {
      toast.error("Failed to update transaction");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className="w-full min-h-screen bg-cover bg-center p-6"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="max-w-7xl mx-auto bg-black/70 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl p-6 text-[#D4AF37]">
        <h1 className="text-3xl font-semibold text-center mb-4">
          Admin Transactions
        </h1>

        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by Transaction ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 p-2 rounded bg-black/60 border border-[#D4AF37]/40 text-[#D4AF37] outline-none"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-[#D4AF37] text-black rounded font-semibold"
          >
            Search
          </button>
        </div>

        <div className="hidden md:grid grid-cols-6 gap-3 font-semibold border-b border-[#D4AF37]/40 pb-2 mb-2">
          <span>Txn ID</span>
          <span>User</span>
          <span>Status</span>
          <span>Amount</span>
          <span>Updated At</span>
          <span>Action</span>
        </div>

        <div className="flex flex-col gap-3">
          {transactions.map((txn) => (
            <div
              key={txn._id}
              className="grid grid-cols-1 md:grid-cols-6 gap-3 border border-[#D4AF37]/40 p-3 rounded bg-black/60"
            >
              <span className="truncate">{txn._id}</span>
              <span>{txn.username || "N/A"}</span>

              <span
                className={`font-semibold ${
                  txn.status === "PENDING"
                    ? "text-yellow-400"
                    : txn.status === "SUCCESS"
                      ? "text-green-400"
                      : "text-red-400"
                }`}
              >
                {txn.status}
              </span>

              <span>₹ {txn.discount_price}</span>
              <span>{new Date(txn.updated_at).toLocaleString()}</span>

              {txn.status === "PENDING" ? (
                <select
                  disabled={updating}
                  defaultValue=""
                  onChange={(e) => handleUpdateTransaction(e.target.value, txn)}
                  className="bg-black border border-[#D4AF37]/40 p-1 rounded text-[#D4AF37]"
                >
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="FAILED">FAILED</option>
                </select>
              ) : txn.status === "SUCCESS" ? (
                <a
                  href={txn.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline font-semibold"
                >
                  View
                </a>
              ) : (
                <span className="text-red-400 font-semibold">FAILED</span>
              )}
            </div>
          ))}
        </div>

        <div ref={observerRef} className="mt-4">
          {loading && <Loader size="md" text="Fetching transactions..." />}

          {!loading && hasError && (
            <div className="text-center mt-4 flex flex-col items-center gap-2">
              <p className="text-red-400 text-sm">
                Failed to load transactions.
              </p>
              <button
                onClick={() => {
                  hasErrorRef.current = false;
                  setHasError(false);
                  fetchTransactions(false);
                }}
                className="px-4 py-1 bg-[#D4AF37] text-black rounded font-semibold text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {!loading &&
            !hasError &&
            totalCount > 0 &&
            transactions.length >= totalCount && (
              <p className="text-center text-sm text-[#D4AF37]/70 mt-4">
                No more transactions
              </p>
            )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-black border border-[#D4AF37]/40 rounded-lg p-6 w-96 text-[#D4AF37]">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Enter Discount Price
            </h2>

            <input
              type="number"
              placeholder="Discount Price"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              className="w-full p-2 rounded bg-black/60 border border-[#D4AF37]/40 outline-none mb-4"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setDiscountPrice("");
                }}
                className="px-4 py-2 border border-[#D4AF37]/40 rounded"
              >
                Cancel
              </button>

              <button
                onClick={confirmSuccessUpdate}
                disabled={updating}
                className="px-4 py-2 bg-[#D4AF37] text-black rounded font-semibold disabled:opacity-50"
              >
                {updating ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
