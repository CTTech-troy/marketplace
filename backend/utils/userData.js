const admin = require("firebase-admin");

function buildUserData(authUser = {}, opts = {}) {
  const now = admin.firestore.Timestamp.now();
  return {
    _id: authUser.uid || opts.uid || null,
    username: opts.username || authUser.displayName || "",
    email: opts.email || authUser.email || "",
    phone: opts.phone || authUser.phoneNumber || null,
    profile: {
      bio: opts.bio || "",
      location: opts.location || "",
      profilePic: opts.profilePic || "",
      ...opts.profile,
    },
    role: opts.role || "buyer",
    followersCount: opts.followersCount || 0,
    followingCount: opts.followingCount || 0,
    amountMadeFromSales: opts.amountMadeFromSales || 0,
    walletBalance: opts.walletBalance || 0,
    createdAt: opts.createdAt || now,
    updatedAt: opts.updatedAt || now,
    authProvider: opts.authProvider || "firebase",
    isVerified: opts.isVerified === true,
    verifiedAt: opts.verifiedAt || null,
    // keep transient verification fields separate (do not include by default)
  };
}

module.exports = { buildUserData };