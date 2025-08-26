import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { auth } from "../../firebase.js";
import { onAuthStateChanged } from "firebase/auth";

const API = import.meta.env.VITE_FIREBASE_API_URL || "http://localhost:5000";

export default function UserProfile() {
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [commentsByProduct, setCommentsByProduct] = useState({});
  const [draftComments, setDraftComments] = useState({});
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState(null);

  // Listen for auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setAuthed(!!u));
    return () => unsub();
  }, []);

  // Helper: get idToken
  const getIdToken = useCallback(async () => {
    try {
      if (auth.currentUser) {
        const t = await auth.currentUser.getIdToken(true);
        sessionStorage.setItem("idToken", t);
        return t;
      }
    } catch (err) {
      console.warn("getIdToken failed:", err);
    }
    return sessionStorage.getItem("idToken") || null;
  }, []);

  // Fetch user profile
  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const idToken = await getIdToken();
        const headers = idToken ? { Authorization: `Bearer ${idToken}` } : {};

        const res = await fetch(`${API}/api/userprofile/${encodeURIComponent(userId)}`, { headers });

        if (!mounted) return;

        if (res.status === 404) {
          setError("User not found");
          setUser(null);
          return;
        }
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.warn("Failed to load user profile:", res.status, txt);
          setError("Failed to load user");
          return;
        }

        const body = await res.json();
        setUser(body.user || null);
      } catch (err) {
        console.error("Failed to load user profile:", err);
        setError("Failed to load user");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [userId, getIdToken]);

  // Fetch user's products
  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    (async () => {
      try {
        const idToken = await getIdToken();
        const headers = idToken ? { Authorization: `Bearer ${idToken}` } : {};

        const res = await fetch(`${API}/api/userprofile/${encodeURIComponent(userId)}/products`, { headers });

        if (!mounted) return;

        if (!res.ok) {
          console.warn("Failed to load user products:", res.status);
          setProducts([]);
          return;
        }

        const body = await res.json();
        setProducts(body.products || []);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        if (mounted) setProducts([]);
      }
    })();

    return () => { mounted = false; };
  }, [userId, getIdToken]);

  // Load comments per product
  const loadComments = useCallback(async (productId) => {
    if (!productId) return;
    try {
      const idToken = await getIdToken();
      const headers = idToken ? { Authorization: `Bearer ${idToken}` } : {};

      const res = await fetch(`${API}/api/comments/product/${encodeURIComponent(productId)}`, { headers });
      if (!res.ok) {
        setCommentsByProduct((s) => ({ ...s, [productId]: [] }));
        return;
      }
      const body = await res.json();
      setCommentsByProduct((s) => ({ ...s, [productId]: body.comments || [] }));
    } catch (err) {
      console.error("loadComments error:", err);
      setCommentsByProduct((s) => ({ ...s, [productId]: [] }));
    }
  }, [getIdToken]);

  const openProduct = (p) => {
    setSelectedProduct(p);
    loadComments(p.id || p._id);
  };

  const handlePostComment = async (productId) => {
    const text = (draftComments[productId] || "").trim();
    if (!text) return;
    if (!authed) return alert("Sign in to comment");

    try {
      const idToken = await getIdToken();
      if (!idToken) throw new Error("Authentication required");

      const res = await fetch(`${API}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ productId, text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to post comment");
      }

      const body = await res.json();
      setCommentsByProduct((s) => ({ ...s, [productId]: [body.comment, ...(s[productId] || [])] }));
      setDraftComments((s) => ({ ...s, [productId]: "" }));
    } catch (err) {
      console.error("Post comment failed:", err);
      alert(err.message || "Failed to post comment");
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!user) return <div className="p-4">User not found</div>;

  const safeUser = {
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    followersCount: user.followersCount || 0,
    followingCount: user.followingCount || 0,
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Profile header */}
      <div className="flex items-center gap-6 border-b pb-4">
        <img src={safeUser.avatar || "https://i.pinimg.com/736x/a4/fa/dd/a4fadd669533cfba33867f7c6fd39eaa.jpg"} alt={safeUser.username} className="w-28 h-28 rounded-full object-cover border" />
        <div>
          <h1 className="text-2xl font-bold">{safeUser.username}</h1>
          <p className="text-gray-600">{safeUser.bio}</p>
          <div className="mt-3 flex gap-6 text-sm text-gray-700">
            <div><strong>{products.length}</strong> Posts</div>
            <div><strong>{safeUser.followingCount}</strong> Following</div>
            <div><strong>{safeUser.followersCount}</strong> Followers</div>
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <section className="mt-6">
        <h2 className="font-semibold mb-3">Posts</h2>
        {products.length === 0 ? (
          <p className="text-gray-500">No posts yet</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {products.map((p) => (
              <div key={p.id || p._id} className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => openProduct(p)}>
                <img src={(p.media && p.media[0]) || "/placeholder.png"} alt={p.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-1 left-1 bg-black/50 text-white px-2 py-1 rounded text-xs">₦{p.price}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Product modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white max-w-3xl w-full rounded-lg overflow-hidden">
            <div className="flex">
              <div className="w-1/2">
                <img src={(selectedProduct.media && selectedProduct.media[0]) || "/placeholder.png"} alt={selectedProduct.title} className="w-full h-full object-cover" />
              </div>
              <div className="w-1/2 p-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={safeUser.avatar || "/default-avatar.png"} alt={safeUser.username} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="font-medium">{safeUser.username}</div>
                      <div className="text-xs text-gray-500">{safeUser.bio}</div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="text-gray-500">✕</button>
                </div>

                <div className="mt-4 flex-1 overflow-auto">
                  <h3 className="font-semibold">{selectedProduct.title}</h3>
                  <p className="text-gray-700 mt-2">{selectedProduct.description}</p>
                  <p className="text-lg font-bold mt-4">₦{selectedProduct.price}</p>

                  {/* Comments */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Comments</h4>
                    <div className="space-y-3 max-h-48 overflow-auto">
                      {(commentsByProduct[selectedProduct.id] || []).map((c) => (
                        <div key={c.id} className="flex items-start gap-3">
                          <img src={c.commenterAvatar || "/default-avatar.png"} alt={c.commenterName} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <div className="text-sm font-medium">{c.commenterName}</div>
                            <div className="text-sm text-gray-700">{c.text}</div>
                            <div className="text-xs text-gray-400">{c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleString() : ""}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <input
                        value={draftComments[selectedProduct.id] || ""}
                        onChange={(e) => setDraftComments((s) => ({ ...s, [selectedProduct.id]: e.target.value }))}
                        className="flex-1 border px-3 py-2 rounded"
                        placeholder={authed ? "Add a comment..." : "Sign in to comment"}
                        disabled={!authed}
                      />
                      <button onClick={() => handlePostComment(selectedProduct.id)} className={`px-3 py-2 rounded ${authed ? "bg-blue-600 text-white" : "bg-gray-200"}`} disabled={!authed}>
                        Post
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
