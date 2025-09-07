import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";

const API_URL = "http://localhost:5000/api/wallet";

export default function WalletDashboard() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const auth = getAuth();

  const getToken = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  };

  const fetchBalance = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API_URL}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setBalance(data.walletBalance);
  };

  const fetchTransactions = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API_URL}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log("Transactions API response:", data);
    // Make sure we always set an array to avoid .map errors
    setTransactions(Array.isArray(data) ? data : data.transactions || []);
  };

  const creditWallet = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API_URL}/credit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount, reason: "Deposit" }),
    });
    const data = await res.json();
    setBalance(data.walletBalance);
    fetchTransactions();
  };

  const fundViaMonnify = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API_URL}/fund`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (data.paymentUrl) window.open(data.paymentUrl, "_blank");
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const formatDate = (ts) => {
    if (!ts) return "N/A";
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Wallet Dashboard</h1>

        {/* Wallet Balance */}
        <div className="bg-white shadow rounded-lg p-6 mb-6 flex justify-between items-center">
          <div>
            <p className="text-gray-500">Current Balance</p>
            <p className="text-2xl font-semibold text-green-600">₦{balance}</p>
          </div>
          <div className="flex gap-4">
            <input
              type="number"
              className="border border-gray-300 rounded px-3 py-2"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={creditWallet}
            >
              Credit Wallet
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={fundViaMonnify}
            >
              Fund via Monnify
            </button>
          </div>
        </div>

        {/* Transactions */}
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
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b">
                    <td className="px-4 py-2">{formatDate(tx.createdAt)}</td>
                    <td className="px-4 py-2 capitalize">{tx.type}</td>
                    <td className="px-4 py-2 text-green-600">₦{tx.amount}</td>
                    <td className="px-4 py-2">{tx.status}</td>
                    <td className="px-4 py-2">{tx.reason}</td>
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
