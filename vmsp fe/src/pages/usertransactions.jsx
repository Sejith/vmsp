import { useEffect, useState, useRef, useCallback } from "react";
import bg from "../assets/background_landscape.png";
import Loader from "../components/loader";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/authcontext";
import { GetTransactions } from "../clients/transactions";

const LIMIT = 10;

const UserTransactions = () => {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);

  const offsetRef = useRef(0);
  const totalCountRef = useRef(0);
  const loadingRef = useRef(false);
  const hasErrorRef = useRef(false);
  const startDateRef = useRef("");
  const endDateRef = useRef("");
  const todayOnlyRef = useRef(false);

  const observerRef = useRef(null);

  const fetchTransactions = useCallback(
    async (reset = false) => {
      if (loadingRef.current) return;
      if (hasErrorRef.current) return;
      if (
        !reset &&
        offsetRef.current >= totalCountRef.current &&
        totalCountRef.current !== 0
      )
        return;

      try {
        loadingRef.current = true;
        setLoading(true);
        setHasError(false);

        const data = await GetTransactions({
          limit: LIMIT,
          offset: reset ? 0 : offsetRef.current,
          username: user?.username,
          startDate: startDateRef.current || null,
          endDate: endDateRef.current || null,
          today: todayOnlyRef.current,
          token: user?.token,
        });

        const fetched = data.transactions || [];
        const count = data.total_count || 0;
        const amount = data.total_amount || 0;

        if (reset) {
          setTransactions(fetched);
          offsetRef.current = fetched.length;
        } else {
          setTransactions((prev) => [...prev, ...fetched]);
          offsetRef.current = offsetRef.current + fetched.length;
        }

        totalCountRef.current = count;
        setTotalCount(count);
        setTotalAmount(amount);
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

  const handleFilter = () => {
    startDateRef.current = startDate;
    endDateRef.current = endDate;
    todayOnlyRef.current = todayOnly;

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

  return (
    <div
      className="w-full min-h-screen bg-cover bg-center p-6"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="max-w-7xl mx-auto bg-black/70 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl p-6 text-[#D4AF37]">
        <h1 className="text-3xl font-semibold text-center mb-6">
          My Transactions
        </h1>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setTodayOnly(false);
            }}
            className="p-2 rounded bg-black/60 border border-[#D4AF37]/40 outline-none"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setTodayOnly(false);
            }}
            className="p-2 rounded bg-black/60 border border-[#D4AF37]/40 outline-none"
          />

          <button
            onClick={() => {
              setTodayOnly(true);
              setStartDate("");
              setEndDate("");
            }}
            className={`px-4 py-2 rounded font-semibold border ${
              todayOnly ? "bg-[#D4AF37] text-black" : "border-[#D4AF37]/40"
            }`}
          >
            Today
          </button>

          <button
            onClick={handleFilter}
            className="px-6 py-2 bg-[#D4AF37] text-black rounded font-semibold"
          >
            Apply
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded border border-[#D4AF37]/40 bg-black/60">
            <p className="text-sm opacity-70">Total Transactions</p>
            <p className="text-2xl font-semibold">{totalCount}</p>
          </div>

          <div className="p-4 rounded border border-[#D4AF37]/40 bg-black/60">
            <p className="text-sm opacity-70">Total Amount</p>
            <p className="text-2xl font-semibold">
              ₹ {totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="hidden md:grid grid-cols-5 gap-3 font-semibold border-b border-[#D4AF37]/40 pb-2 mb-2">
          <span>Txn ID</span>
          <span>Status</span>
          <span>Amount</span>
          <span>Updated At</span>
          <span>Receipt</span>
        </div>

        <div className="flex flex-col gap-3">
          {transactions.map((txn) => (
            <div
              key={txn._id}
              className="grid grid-cols-1 md:grid-cols-5 gap-3 border border-[#D4AF37]/40 p-3 rounded bg-black/60"
            >
              <span className="truncate">{txn._id}</span>

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

              {txn.status === "SUCCESS" && txn.invoice_url ? (
                <a
                  href={txn.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline font-semibold"
                >
                  View
                </a>
              ) : (
                <span className="opacity-50">—</span>
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
            transactions.length >= totalCount &&
            totalCount > 0 && (
              <p className="text-center text-sm text-[#D4AF37]/70 mt-4">
                No more transactions
              </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default UserTransactions;
