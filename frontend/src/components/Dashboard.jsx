import React, { useEffect, useState, useCallback, useRef } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { auth } from "../../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { io } from "socket.io-client";

// ensure API constant exists
const API = import.meta.env.VITE_FIREBASE_API_URL || "http://localhost:5000";
const SOCKET_URL = import.meta.env.VITE_FIREBASE_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [collections, setCollections] = useState({});
  const [usersData, setUsersData] = useState([]);
  const [userProducts, setUserProducts] = useState([]);
  const [error, setError] = useState(null);
  const [followState, setFollowState] = useState({});
  const [activeTab, setActiveTab] = useState("products");

  // highlight selected user when opening chat
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Modal / UI states
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [commentsByProduct, setCommentsByProduct] = useState({}); // { [productId]: [comments] }
  const [productComments, setProductComments] = useState({}); // draft comment text per product
  const [likedProducts, setLikedProducts] = useState({});

  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    media: "",
    location: "",
    category: "product",
    tags: "",
    isVisible: true,
  });

  // notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const socketRef = useRef(null);

  // Track auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthed(!!user);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  const getIdToken = useCallback(async () => {
    if (auth.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken(true);
        sessionStorage.setItem("idToken", idToken);
        return idToken;
      } catch (err) {
        console.warn("Failed to get fresh token:", err);
        return null;
      }
    }
    return null;
  }, []);

  // Fetch all users (excluding current)
  const fetchUsers = useCallback(async () => {
    try {
      setLoadingData(true);
      const idToken = await getIdToken();
      if (!idToken) return setError("No id token available");

      const res = await fetch(`${API}/api/users`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      setUsersData(data.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to fetch user list");
    } finally {
      setLoadingData(false);
    }
  }, [getIdToken]);

  // Load dashboard collections and user products
  const loadDashboard = useCallback(async () => {
    setError(null);
    setCollections({});
    setUserProducts([]);
    setLoadingData(true);

    try {
      const idToken = await getIdToken();
      if (!idToken) return setError("No id token available");

      // Fetch dashboard collections
      const res = await fetch(`${API}/api/dashboard`, {
        method: "GET",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || "Failed to load dashboard");
      } else {
        const body = await res.json();
        setCollections(body.collections || {});
      }

      // Fetch products for current user
      const productsRes = await fetch(`${API}/api/products`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setUserProducts(productsData.products || []);
      } else {
        // keep empty products on failure
        setUserProducts([]);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError("Failed to connect to server");
    } finally {
      setLoadingData(false);
    }
  }, [getIdToken]);

  // loadComments must be defined before any early returns (it's a hook)
  const loadComments = useCallback(
    async (productId) => {
      if (!productId) return;
      try {
        const idToken = await getIdToken();
        if (!idToken) throw new Error("No id token");
        const res = await fetch(`${API}/api/comments/product/${encodeURIComponent(productId)}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) {
          console.warn("Failed to load comments for", productId);
          setCommentsByProduct((s) => ({ ...s, [productId]: [] }));
          return;
        }
        const body = await res.json();
        setCommentsByProduct((s) => ({ ...s, [productId]: body.comments || [] }));
      } catch (err) {
        console.error("loadComments error:", err);
        setCommentsByProduct((s) => ({ ...s, [productId]: [] }));
      }
    },
    [getIdToken]
  );

  useEffect(() => {
    if (!loadingAuth && authed) {
      loadDashboard();
      fetchUsers();
    }
  }, [loadingAuth, authed, loadDashboard, fetchUsers]);

  // load comments when modal opens for a product
  useEffect(() => {
    if (selectedProduct) {
      loadComments(selectedProduct.id);
    }
  }, [selectedProduct, loadComments]);

  // Socket.io presence and notification setup (runs after auth)
  useEffect(() => {
    let mounted = true;
    const setup = async () => {
      const current = auth.currentUser;
      if (!current) return;
      const uid = current.uid;

      if (!socketRef.current) {
        socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });
      }
      const socket = socketRef.current;
      const token = await current.getIdToken(true).catch(() => null);
      socket.emit("authenticate", { token });

      const presenceHandler = ({ uid: pUid, online }) => {
        setUsersData((prev) =>
          prev.map((u) => {
            const id = u._id || u.id;
            return id === pUid ? { ...u, isOnline: online } : u;
          })
        );
      };
      const notificationHandler = (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + (notif.is_read ? 0 : 1));
      };

      socket.on("presence:update", presenceHandler);
      socket.on("notification", notificationHandler);

      // fetch initial notifications with auth header
      try {
        const res = await fetch(`${API}/api/notifications/${encodeURIComponent(uid)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    if (authed) setup();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.off("presence:update");
        socketRef.current.off("notification");
        // do not disconnect to preserve socket if other components rely on it,
        // but if you want to fully close on unmount uncomment next line:
        // socketRef.current.disconnect();
      }
    };
  }, [authed]);

  // Always call hooks before any early returns
  if (loadingAuth) return null;
  if (!authed) return <Navigate to="/login" replace />;

  // Follow toggle
  const toggleFollow = (userId) => {
    setFollowState((s) => ({ ...s, [userId]: !s[userId] }));
  };

  // Navigate to chat with user (creates or opens 1:1 chat)
  const handleSendMessage = (user) => {
    const otherId = user._id || user.id;
    if (!otherId) return;
    setSelectedUserId(otherId);
    setActiveTab("messages");

    const minimalUser = {
      id: otherId,
      username: user.username || user.displayName || user.name || user.email || otherId,
      avatar: user.profile?.profilePic || user.avatar || user.photoURL || `https://i.pravatar.cc/40?u=${otherId}`,
    };

    // navigate to ChatPage and pass minimal user data so header shows name + avatar immediately
    navigate(`/chat/user/${encodeURIComponent(otherId)}`, { state: { user: minimalUser } });
  };

  // Add new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const idToken = await getIdToken();
      const res = await fetch(`${API}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price),
          media: newProduct.media ? newProduct.media.split(",").map((m) => m.trim()) : [],
          tags: newProduct.tags ? newProduct.tags.split(",").map((t) => t.trim()) : [],
          createdAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to add product");

      const data = await res.json();
      setUserProducts((prev) => [data.product, ...prev]);

      // Reset modal
      setShowAddProduct(false);
      setNewProduct({
        title: "",
        description: "",
        price: "",
        media: "",
        location: "",
        category: "product",
        tags: "",
        isVisible: true,
      });
    } catch (err) {
      console.error("Add product failed:", err);
      alert("Failed to add product");
    }
  };

  // post a comment
  const handlePostComment = async (productId) => {
    const text = (productComments[productId] || "").trim();
    if (!text) return;
    try {
      const idToken = await getIdToken();
      if (!idToken) throw new Error("Not authenticated");

      const res = await fetch(`${API}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ productId, text }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to post comment");
      }
      const body = await res.json();
      // prepend new comment and clear draft
      setCommentsByProduct((s) => {
        const list = s[productId] ? [body.comment, ...s[productId]] : [body.comment];
        return { ...s, [productId]: list };
      });
      setProductComments((s) => ({ ...s, [productId]: "" }));
    } catch (err) {
      console.error("Post comment failed:", err);
      alert(err.message || "Failed to post comment");
    }
  };

  const currentUser = collections?.currentUser || {};
  const postsCount = userProducts.length;
  const followingCount = currentUser.followingCount || (collections?.following?.length || 0);
  const followersCount = currentUser.followersCount || (collections?.followers?.length || 0);

  const toggleNotifications = () => setShowNotifications((s) => !s);

  const markNotificationRead = async (nid) => {
    try {
      const token = await getIdToken();
      await fetch(`${API}/api/notifications/${encodeURIComponent(nid)}/read`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setNotifications((prev) => prev.map((n) => (n.id === nid ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn("Failed to mark notification read:", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Profile Header */}
      <div className="flex items-start justify-between border-b pb-4">
        <div className="flex items-center space-x-6">
          <img
            src={
              currentUser?.avatar ||
              auth.currentUser?.photoURL ||
              "https://i.pinimg.com/736x/a4/fa/dd/a4fadd669533cfba33867f7c6fd39eaa.jpg"
            }
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border"
          />
          <div>
            <h2 className="text-2xl font-bold">
              {currentUser?.username || auth.currentUser?.displayName || "User"}
            </h2>
            <p className="text-gray-600">
              {currentUser?.email || auth.currentUser?.email || "Email"}
            </p>
            <div className="flex space-x-6 mt-2 text-sm">
              <span>
                <strong>{postsCount}</strong> Posts
              </span>
              <span>
                <strong>{followingCount}</strong> Following
              </span>
              <span>
                <strong>{followersCount}</strong> Followers
              </span>
            </div>
          </div>
        </div>

        {/* Notifications button + dropdown */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="px-3 py-2 bg-gray-100 rounded-full flex items-center gap-2"
            aria-haspopup="true"
            aria-expanded={showNotifications}
          >
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50 p-2 max-h-96 overflow-auto">
              {notifications.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2 border-b cursor-pointer ${n.is_read ? "bg-white" : "bg-green-50"}`}
                    onClick={() => markNotificationRead(n.id)}
                  >
                    <div className="font-medium">{n.title}</div>
                    <div className="text-sm text-gray-600 truncate">{n.message}</div>
                    <div className="text-xs text-gray-400">{n.created_at ? new Date(n.created_at.seconds ? n.created_at.seconds * 1000 : n.created_at).toLocaleString() : ""}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mt-6 border-t pt-2 text-gray-600 text-sm">
        {[
          "products",
          "messages",
          "users",
          "orders",
          "walletTransactions",
          "reviews",
          "notifications",
        ].map((tab) => (
          <button
            key={tab}
            className={`px-3 py-2 ${activeTab === tab ? "font-bold border-t-2 border-black" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.replace(/([A-Z])/g, " $1")}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-4">
        {loadingData && <p>Loading data...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loadingData && (
          <>
            {/* Products Tab */}
            {activeTab === "products" && (
              <div>
                <div className="flex justify-end mb-3">
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-full shadow"
                  >
                    ➕ New Post
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  {userProducts.length ? (
                    userProducts.map((p) => (
                      <div
                        key={p.id}
                        className="relative aspect-square overflow-hidden cursor-pointer"
                        onClick={() => setSelectedProduct(p)}
                      >
                        <img
                          src={p.media?.[0] || "/placeholder.png"}
                          alt={p.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded">
                          <span className="text-white font-semibold block">
                            {p.title}
                          </span>
                          <span className="text-white font-semibold block">
                            ₦{p.price}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-3 text-center text-gray-500">No posts yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === "messages" && (
              <div className="space-y-3">
                {(collections?.messages || []).map((m) => {
                  const fromId = m.fromId || m.senderId || m.userId || m._from;
                  return (
                    <div
                      key={m.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{m.from || fromId}</p>
                        <p className="text-xs text-gray-600 truncate max-w-xs">
                          {m.text}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
                          onClick={() => {
                            if (m.chatId) navigate(`/chat/${m.chatId}`);
                            else if (fromId) navigate(`/chat/user/${encodeURIComponent(fromId)}`);
                            else alert(`No chat id available for this message`);
                          }}
                        >
                          Open
                        </button>
                        <button
                          className="text-sm px-3 py-1 rounded bg-gray-200"
                          onClick={() => {
                            // quick highlight when clicking message preview
                            setSelectedUserId(fromId || null);
                          }}
                        >
                          Highlight
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="grid grid-cols-2 gap-3">
                {usersData.length ? (
                  usersData.map((u) => {
                    const uid = u._id || u.id;
                    const isSelected = selectedUserId && uid === selectedUserId;
                    return (
                      <div
                        key={uid}
                        className={`flex justify-between items-center p-3 border rounded-lg transition ${isSelected ? "ring-2 ring-blue-400 bg-blue-50" : "bg-white"}`}
                      >
                        <Link
                          to={`/user/${encodeURIComponent(uid)}`}
                          className="flex items-center gap-3 flex-1 no-underline text-inherit"
                        >
                          <img
                            src={u.profile?.profilePic || u.avatar || "https://i.pinimg.com/736x/a4/fa/dd/a4fadd669533cfba33867f7c6fd39eaa.jpg"}
                            alt={u.username || u.email}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">{u.username || u.email}</p>
                            <p className="text-xs text-gray-600">{u.email}</p>
                          </div>
                        </Link>

                        <div className="flex gap-2">
                          <button
                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
                            onClick={() => handleSendMessage(u)}
                          >
                            Message
                          </button>
                          <button
                            className={`text-sm px-3 py-1 rounded ${followState[uid] ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}
                            onClick={() => toggleFollow(uid)}
                          >
                            {followState[uid] ? "Unfollow" : "Follow"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="col-span-2 text-center text-gray-500">
                    No users found
                  </p>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <ul className="space-y-2">
                {(collections?.orders || []).map((o) => (
                  <li
                    key={o.id}
                    className="p-3 border rounded-md flex justify-between"
                  >
                    <span>Order {o.id}</span>
                    <span
                      className={`px-2 rounded text-sm ${o.status === "completed" ? "bg-green-200" : "bg-yellow-200"}`}
                    >
                      {o.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Wallet Transactions Tab */}
            {activeTab === "walletTransactions" && (
              <div>
                <div className="mb-3">
                  <button
                    onClick={() => alert("Open Add Money modal")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-full shadow"
                  >
                    💰 Add Money
                  </button>
                </div>
                <ul className="space-y-2">
                  {collections?.walletTransactions?.map((t) => (
                    <li
                      key={t.id}
                      className="p-3 border rounded-md flex justify-between"
                    >
                      <span>{t.type}</span>
                      <span className="font-medium">₦{t.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="space-y-2">
                {collections?.reviews?.map((r) => (
                  <div key={r.id} className="p-3 border rounded-md">
                    <p className="font-medium">{r.reviewer}</p>
                    <p className="text-sm">{r.comment}</p>
                    <p className="text-xs text-yellow-500">
                      {"⭐".repeat(r.rating)}
                    </p>
                  </div>
                ))}
              </div>
            )}

          </>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Create New Post</h2>
            <form onSubmit={handleAddProduct} className="space-y-3">
              {/* Title, description, price, media, location, category, tags, visibility */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newProduct.title}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Price (₦)
                </label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, price: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Media (URLs, comma-separated)
                </label>
                <input
                  type="text"
                  value={newProduct.media}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, media: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newProduct.location}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, location: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newProduct.tags}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, tags: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={newProduct.isVisible}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, isVisible: e.target.checked }))
                  }
                  className="mr-2"
                />
                <label className="text-sm">
                  Make this post visible to others
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Create Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white w-full max-w-2xl rounded-lg overflow-hidden relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✕
            </button>

            <img
              src={selectedProduct.media?.[0] || "/placeholder.png"}
              alt={selectedProduct.title}
              className="w-full h-96 object-cover"
            />

            <div className="p-4">
              <h2 className="font-bold text-lg">{selectedProduct.title}</h2>
              <p className="text-gray-700 mb-2">₦{selectedProduct.price}</p>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-2">
                <button
                  onClick={() =>
                    setLikedProducts((prev) => ({
                      ...prev,
                      [selectedProduct.id]: !prev[selectedProduct.id],
                    }))
                  }
                  className={`px-3 py-1 rounded ${likedProducts[selectedProduct.id] ? "bg-red-500 text-white" : "bg-gray-200"}`}
                >
                  {likedProducts[selectedProduct.id] ? "Liked ❤️" : "Like"}
                </button>
                <button className="px-3 py-1 rounded bg-gray-200">Share</button>
              </div>

              {/* Comments */}
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Comments</h3>

                <div className="space-y-3 max-h-48 overflow-auto">
                  {(commentsByProduct[selectedProduct.id] || []).map((c) => (
                    <div key={c.id} className="flex items-start gap-3 border-b pb-2">
                      <img src={c.commenterAvatar || "https://i.pinimg.com/736x/a4/fa/dd/a4fadd669533cfba33867f7c6fd39eaa.jpg"} alt={c.commenterName} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="text-sm font-medium">{c.commenterName}</div>
                        <div className="text-sm text-gray-700">{c.text}</div>
                        <div className="text-xs text-gray-400">{c.createdAt ? new Date(c.createdAt.seconds ? c.createdAt.seconds * 1000 : c.createdAt).toLocaleString() : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={productComments[selectedProduct.id] || ""}
                    onChange={(e) => setProductComments((p) => ({ ...p, [selectedProduct.id]: e.target.value }))}
                    className="flex-1 border px-2 py-1 rounded"
                  />
                  <button
                    onClick={() => handlePostComment(selectedProduct.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
