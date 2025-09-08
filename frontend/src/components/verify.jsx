import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";

const API_URL = "http://localhost:5000/api/wallet";

export default function WalletDashboard() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const auth = getAuth();

  // 🔑 Get Firebase token
  const getToken = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  };

  // 👤 Fetch logged-in user details
  const fetchUserDetails = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setUserDetails({
      name: user.displayName || "Anonymous User",
      email: user.email,
      uid: user.uid,
      followers: 0, 
      following: 0, 
    });
  };

  // 💰 Fetch wallet balance
  const fetchBalance = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.warn("⚠️ No token found, user might not be logged in");
        return;
      }

      console.log("📡 Fetching wallet balance...");
      const res = await fetch(`${API_URL}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      console.log("✅ Wallet balance response:", data);

      if (!res.ok) throw new Error(data.error || "Failed to fetch balance");
      setBalance(data.walletBalance ?? 0);
    } catch (err) {
      console.error("❌ Error fetching balance:", err.message);
      setBalance(0);
    }
  };

  // 🧾 Fetch transactions
  const fetchTransactions = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      console.log("📡 Fetching transactions...");
      const res = await fetch(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      console.log("✅ Transactions response:", data);

      if (!res.ok) throw new Error(data.error || "Failed to fetch transactions");
      setTransactions(Array.isArray(data) ? data : data.transactions || []);
    } catch (err) {
      console.error("❌ Error fetching transactions:", err.message);
      setTransactions([]);
    }
  };

  // ➕ Credit wallet manually
  const creditWallet = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("⚠️ Please enter a valid amount before crediting wallet.");
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      console.log("📤 Sending credit wallet request:", {
        amount: Number(amount),
        reason: "Manual credit",
      });

      const res = await fetch(`${API_URL}/credit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(amount), reason: "Manual credit" }),
      });

      const data = await res.json();
      console.log("✅ Credit wallet response:", data);

      if (!res.ok) {
        console.error("❌ Credit wallet failed:", data.error);
        alert(`Failed to credit wallet: ${data.error || "Unknown error"}`);
        return;
      }

      setBalance(data.walletBalance ?? balance);
      fetchTransactions();
    } catch (err) {
      console.error("❌ Unexpected error crediting wallet:", err);
      alert("An unexpected error occurred while crediting wallet.");
    }
  };

  // 💳 Fund via Monnify
  const fundViaMonnify = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("⚠️ Please enter a valid amount before funding wallet.");
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      console.log("📤 Sending fund via Monnify request:", { amount: Number(amount) });

      const res = await fetch(`${API_URL}/fund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      const data = await res.json();
      console.log("✅ Monnify funding response:", data);

      if (!res.ok) {
        console.error("❌ Monnify funding failed:", data.error);
        alert(`Failed to initialize funding: ${data.error || "Unknown error"}`);
        return;
      }

      if (data.paymentUrl) {
        console.log("🔗 Opening Monnify payment URL...");
        window.open(data.paymentUrl, "_blank");
      }
    } catch (err) {
      console.error("❌ Unexpected error funding via Monnify:", err);
      alert("An unexpected error occurred while funding wallet.");
    }
  };

  useEffect(() => {
    fetchUserDetails();
    fetchBalance();
    fetchTransactions();
  }, []);

  const formatDate = (ts) => {
    try {
      if (!ts) return "N/A";
      if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
      return new Date(ts).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Wallet Dashboard</h1>

        {/* User Info */}
        {userDetails && (
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <p className="text-gray-700">
              <span className="font-semibold">Name:</span> {userDetails.name}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Email:</span> {userDetails.email}
            </p>
            <p className="text-gray-500 text-sm">
              UID: <span className="font-mono">{userDetails.uid}</span>
            </p>
            <p className="text-gray-500 text-sm">
              Followers: <span className="font-mono">{userDetails.followers}</span>
            </p>
            <p className="text-gray-500 text-sm">
              Following: <span className="font-mono">{userDetails.following}</span>
            </p>
          </div>
        )}

        {/* Wallet Balance */}
        <div className="bg-white shadow rounded-lg p-6 mb-6 flex justify-between items-center">
          <div>
            <p className="text-gray-500">Current Balance</p>
            <p className="text-2xl font-semibold text-green-600">
              ₦{Number(balance ?? 0).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-3">
            <input
              type="number"
              className="border border-gray-300 rounded px-3 py-2"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={creditWallet}
            >
              Credit Wallet
            </button>
            <button
              className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600"
              onClick={fundViaMonnify}
            >
              <img
                src="https://res.cloudinary.com/dxfq3iotg/image/upload/v1671551898/monnify-logo.png"
                alt="Monnify"
                className="h-5"
              />
              Fund via Monnify
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500">No transactions yet.</p>
          ) : (
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Reason</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr key={tx.id || idx} className="border-b">
                    <td className="px-4 py-2">{formatDate(tx.createdAt)}</td>
                    <td className="px-4 py-2 capitalize">{tx.type || "N/A"}</td>
                    <td
                      className={`px-4 py-2 ${
                        tx.type === "debit" ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      ₦{Number(tx.amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">{tx.status || "N/A"}</td>
                    <td className="px-4 py-2">{tx.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
