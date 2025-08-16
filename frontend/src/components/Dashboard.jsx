import React, { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Dashboard({ user, products: initialProducts = [], onSendMessage }) {
  const [message, setMessage] = useState("");
  const [testFollowUser, setTestFollowUser] = useState("");
  const [fullUser, setFullUser] = useState(user || null);
  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // followers list state
  const [followersList, setFollowersList] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);

  // suggestion state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFollowingTarget, setIsFollowingTarget] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Fetch full user details from backend if we only have an id or incomplete data
  useEffect(() => {
    let mounted = true;
    const uid = (user && (user._id || user.uid)) || null;

    // if no uid or full profile already present, skip fetch
    if (!uid) return;
    const hasProfile = (user && user.profile && (user.username || user.email));
    if (hasProfile) {
      setFullUser(user);
      // if user has embedded products array use it
      if (user.products && user.products.length) setProducts(user.products);
      // fetch followers for this user
      fetchFollowers(uid);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/users/${uid}`);
        if (!res.ok) {
          console.warn("Failed to fetch full user:", await res.text());
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        setFullUser(data.user || data);
        // if backend returns products or subcollection, setProducts
        if (data.user && data.user.products) setProducts(data.user.products);
        // fetch followers for this user
        fetchFollowers(uid);
      } catch (err) {
        console.error("Error fetching user details:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  // fetch followers helper
  const fetchFollowers = async (uid) => {
    if (!uid) return;
    setLoadingFollowers(true);
    try {
      const res = await fetch(`${API}/api/users/${encodeURIComponent(uid)}/followers`);
      if (!res.ok) {
        console.warn("Failed to fetch followers:", await res.text());
        setFollowersList([]);
        return;
      }
      const data = await res.json();
      setFollowersList(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error("Error fetching followers:", err);
      setFollowersList([]);
    } finally {
      setLoadingFollowers(false);
    }
  };

  // fetch suggestions (debounced) with meId so backend returns isFollowing
  const fetchSuggestions = async (q) => {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsFollowingTarget(false);
      return;
    }
    try {
      const meId = fullUser && (fullUser._id || fullUser.id || fullUser.uid) ? encodeURIComponent(fullUser._id || fullUser.id || fullUser.uid) : "";
      const url = `${API}/api/users/search?q=${encodeURIComponent(q)}${meId ? `&meId=${meId}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn("Failed to fetch suggestions:", await res.text());
        setSuggestions([]);
        setShowSuggestions(false);
        setIsFollowingTarget(false);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data.users) ? data.users : [];
      setSuggestions(list);
      setShowSuggestions(true);
      // if the typed text exactly matches a suggestion, set isFollowingTarget appropriately
      const exact = list.find(u => u.username.toLowerCase() === q.toLowerCase());
      setIsFollowingTarget(Boolean(exact && exact.isFollowing));
    } catch (err) {
      console.error("Suggestion fetch error:", err);
      setSuggestions([]);
      setShowSuggestions(false);
      setIsFollowingTarget(false);
    }
  };

  const handleSendMessage = () => {
    if (message.trim() === "") return;
    onSendMessage && onSendMessage(message);
    alert(`Message sent: ${message}`);
    setMessage("");
  };

  const handleFollowInputChange = (val) => {
    setTestFollowUser(val);
    setIsFollowingTarget(false);
    // debounce requests
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val.trim());
    }, 250);
  };

  // click outside to hide suggestions
  useEffect(() => {
    const onClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const handleSuggestionClick = (u) => {
    setTestFollowUser(u.username);
    setShowSuggestions(false);
    setIsFollowingTarget(Boolean(u.isFollowing));
  };

  // toggle follow/unfollow
  const handleFollow = async () => {
    const targetUsername = testFollowUser?.trim();
    if (!targetUsername) return alert("Enter a username to follow");
    if (!fullUser || !fullUser._id) return alert("Your user id is not available");

    if (followLoading) return;
    setFollowLoading(true);
    try {
      const res = await fetch(`${API}/api/users/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: fullUser._id, targetUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Follow failed");

      // data.action is 'followed' or 'unfollowed'
      if (data.action === "followed") {
        setFullUser((u) => ({ ...u, followingCount: (u.followingCount || 0) + 1 }));
        setIsFollowingTarget(true);
        alert(`You are now following ${targetUsername}.`);
      } else if (data.action === "unfollowed") {
        setFullUser((u) => ({ ...u, followingCount: Math.max(0, (u.followingCount || 0) - 1) }));
        setIsFollowingTarget(false);
        alert(`You unfollowed ${targetUsername}.`);
      }

      // update suggestions list state if present
      setSuggestions((s) => s.map(item => item.username === targetUsername ? { ...item, isFollowing: data.action === "followed" } : item));
      // refresh followers list (since counts changed)
      fetchFollowers(fullUser._id);
      setTestFollowUser("");
      setShowSuggestions(false);
    } catch (err) {
      console.error("Follow failed", err);
      alert("Follow failed: " + (err.message || err));
    } finally {
      setFollowLoading(false);
    }
  };

  // message a follower (prompt then call onSendMessage or show alert)
  const handleMessageToFollower = async (follower) => {
    const text = window.prompt(`Message to ${follower.username}:`);
    if (!text || text.trim() === "") return;
    if (onSendMessage) {
      try {
        await onSendMessage({ to: follower.id, message: text.trim() });
        alert("Message sent.");
      } catch (err) {
        console.error("onSendMessage failed:", err);
        alert("Failed to send message.");
      }
    } else {
      // fallback: simply show alert (or implement backend messages endpoint later)
      alert(`To ${follower.username}: ${text.trim()}`);
    }
  };

  // helper to safely read nested props
  const get = (obj, path, fallback = "") => {
    try {
      return path.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const followers = get(fullUser, "followersCount", get(fullUser, "followers", 0));
  const following = get(fullUser, "followingCount", get(fullUser, "following", 0));
  const walletBalance = get(fullUser, "walletBalance", 0);
  const amountMade = get(fullUser, "amountMadeFromSales", 0);
  const username = get(fullUser, "username", get(fullUser, "profile.displayName", "User"));
  const email = get(fullUser, "email", get(fullUser, "profile.email", ""));
  const profilePic = get(fullUser, "profile.profilePic", get(fullUser, "profilePic", "https://via.placeholder.com/150"));
  const bio = get(fullUser, "profile.bio", "");

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <div className="flex items-center gap-4">
          <img src={profilePic} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
          <div>
            <h2 className="text-2xl font-bold">{username}</h2>
            <p className="text-sm text-gray-500">{email}</p>
            {bio && <p className="mt-2 text-gray-700">{bio}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-gray-500">Followers</p>
            <p className="text-lg font-bold">{followers}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-gray-500">Following</p>
            <p className="text-lg font-bold">{following}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg text-center">
            <p className="text-gray-500">Wallet Balance</p>
            <p className="text-lg font-bold">₦{walletBalance}</p>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>Amount made from sales: ₦{amountMade}</p>
          <p className="text-xs text-gray-400">Member since: {fullUser?.createdAt ? new Date(fullUser.createdAt).toLocaleDateString() : "—"}</p>
        </div>
      </div>

      {/* Followers list with message button in front */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Followers</h3>

        {loadingFollowers ? (
          <div className="text-sm text-gray-500">Loading followers...</div>
        ) : followersList.length === 0 ? (
          <div className="text-sm text-gray-500">No followers yet.</div>
        ) : (
          <ul className="space-y-3">
            {followersList.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-4 border rounded p-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleMessageToFollower(f)}
                    className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
                    title={`Message ${f.username}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.95-1.3L3 20l1.3-3.05A9.863 9.863 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>

                  <img src={f.profilePic || "https://randomuser.me/api/portraits/lego/1.jpg"} alt={f.username} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="font-medium text-gray-900">{f.username}</div>
                    <div className="text-xs text-gray-500">{f.email}</div>
                  </div>
                </div>

                <div className="text-right text-sm text-gray-500">
                  <div>Followers: {f.followersCount}</div>
                  <div>Following: {f.followingCount}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Products / messaging / follow UI (unchanged) */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Products / Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products && products.length > 0 ? (
            products.map((product) => (
              <div key={product._id || product.id || Math.random()} className="border rounded-lg p-4 bg-gray-50">
                {product.media && product.media[0] ? (
                  <img src={product.media[0]} alt={product.title} className="w-full h-32 object-cover rounded mb-2" />
                ) : null}
                <h4 className="font-bold">{product.title || product.name}</h4>
                <p className="text-gray-600">{product.description || product.summary}</p>
                <p className="mt-1 font-semibold">₦{product.price ?? product.amount ?? "0"}</p>
              </div>
            ))
          ) : (
            <p>No products found.</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Test Messaging</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Write a test message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Follow Test Account</h3>
        <div ref={containerRef} className="relative flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter username to follow..."
              value={testFollowUser}
              onChange={(e) => handleFollowInputChange(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              autoComplete="off"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-56 overflow-auto">
                {suggestions.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSuggestionClick(u)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-3"
                  >
                    <img
                      src={u.profilePic || "https://randomuser.me/api/portraits/lego/1.jpg"}
                      alt={u.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{u.username}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                    <div>
                      <span className={`text-xs px-2 py-1 rounded ${u.isFollowing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {u.isFollowing ? 'Following' : 'Follow'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleFollow}
            disabled={followLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {followLoading ? "Processing..." : (isFollowingTarget ? "Unfollow" : "Follow")}
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-4">Loading...</div>}
    </div>
  );
}
