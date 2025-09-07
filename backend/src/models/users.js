// profileModel.js
import { firestore } from '../config/firebase.js';

const profilesCollection = firestore.collection('profiles');
const walletCollection = firestore.collection('wallet_transactions');
const ordersCollection = firestore.collection('orders');

// Create profile
export const createProfile = async (profileData) => {
  const profileRef = profilesCollection.doc(profileData.userId);
  await profileRef.set({
    username: profileData.username || '',
    bio: profileData.bio || '',
    locationName: profileData.locationName || '',
    coordinates: profileData.coordinates || { lat: null, lng: null },
    profilePic: profileData.profilePic || '',
    isAnonymous: profileData.isAnonymous || false,
    followersCount: 0,
    followingCount: 0,
    totalSales: 0,
    walletBalance: 0,
    posts: [],
    stories: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return (await profileRef.get()).data();
};

// Get profile with wallet info
export const getProfile = async (userId) => {
  const profileDoc = await profilesCollection.doc(userId).get();
  if (!profileDoc.exists) throw new Error('Profile not found');

  const profileData = profileDoc.data();

  // Calculate wallet balance
  const walletSnapshot = await walletCollection.where('userId', '==', userId).get();
  let walletBalance = 0;
  walletSnapshot.forEach(doc => {
    const { type, amount } = doc.data();
    walletBalance += type === 'credit' ? amount : -amount;
  });

  // Calculate total sales from orders
  const ordersSnapshot = await ordersCollection
    .where('buyerId', '==', userId)
    .where('status', '==', 'completed')
    .get();
  let totalSales = 0;
  ordersSnapshot.forEach(doc => {
    totalSales += doc.data().amount;
  });

  return {
    ...profileData,
    walletBalance,
    totalSales
  };
};

// Update profile
export const updateProfile = async (userId, updateData) => {
  const profileRef = profilesCollection.doc(userId);
  await profileRef.update({
    ...updateData,
    updatedAt: new Date()
  });
  return await getProfile(userId); // Return updated profile with wallet info
};


export default { createProfile, getProfile, updateProfile };