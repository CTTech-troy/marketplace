// controllers/userController.js
import { firestore, admin } from "../config/firebase.js";
import { createUserWithProfile } from "../models/users.js";

const usersCol = firestore.collection("users");
const profilesCol = firestore.collection("profiles");

// GET all users
export const getAllUsers = async (req, res, next) => {
  try {
    const snapshot = await usersCol.get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// GET user by ID
export const getUserById = async (req, res, next) => {
  try {
    const doc = await usersCol.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "User not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    next(err);
  }
};

// GET logged-in user's profile (requires auth)
export const getUserProfile = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const profileDoc = await profilesCol.doc(uid).get();
    if (!profileDoc.exists) return res.status(404).json({ error: "Profile not found" });

    res.json({ id: profileDoc.id, ...profileDoc.data() });
  } catch (err) {
    next(err);
  }
};

// PATCH to disable/enable a user
export const disableUser = async (req, res, next) => {
  try {
    await usersCol.doc(req.params.id).update({ disabled: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ success: true, message: "User disabled" });
  } catch (err) {
    next(err);
  }
};

// DELETE user
export const deleteUser = async (req, res, next) => {
  try {
    await usersCol.doc(req.params.id).delete();
    await profilesCol.doc(req.params.id).delete();
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    next(err);
  }
};

// Ensure user has all documents (called on login/signup)
export const ensureUserInitialized = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const authUser = await admin.auth().getUser(uid);
    const result = await createUserWithProfile(
      uid,
      authUser.email ?? null,
      authUser.displayName ?? "",
      authUser.photoURL ?? null
    );

    res.json({ success: true, user: result });
  } catch (err) {
    next(err);
  }
};
