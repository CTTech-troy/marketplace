// controllers/userController.js
import User from "../models/users.js";

/**
 * Get all users
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: "No users found" });
    }

    const formattedUsers = users.map((u) => ({
      ...u,
      isOnline: u.isOnline || false,
    }));

    res.status(200).json({ success: true, count: formattedUsers.length, data: formattedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, data: { ...user, isOnline: user.isOnline || false } });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Toggle user status (Disable / Enable)
 */
export const disableUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // must be "Disabled" or "Active"

    if (!["Disabled", "Active"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const result = await User.updateOne({ firebaseUID: id }, { $set: { status } });
    if (result.matchedCount === 0) return res.status(404).json({ success: false, message: "User not found" });

    const updatedUser = await User.findById(id);
    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: { ...updatedUser, isOnline: updatedUser.isOnline || false },
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await User.deleteOne({ firebaseUID: id });

    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Optional: get logged-in user's profile
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id; // requires auth middleware
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, data: { ...user, isOnline: user.isOnline || false } });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Optional: Set user online/offline
 */
export const setUserOnlineStatus = async (userId, isOnline) => {
  try {
    await User.updateOne({ firebaseUID: userId }, { $set: { isOnline } });
  } catch (error) {
    console.error(`Error updating online status for user ${userId}:`, error);
  }
};

/**
 * Add follower
 */
export const addFollower = async (req, res) => {
  try {
    const { userId, followerId } = req.body;
    await User.addFollower(userId, followerId);
    res.status(200).json({ success: true, message: "Follower added successfully" });
  } catch (error) {
    console.error("Error adding follower:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Remove follower
 */
export const removeFollower = async (req, res) => {
  try {
    const { userId, followerId } = req.body;
    await User.removeFollower(userId, followerId);
    res.status(200).json({ success: true, message: "Follower removed successfully" });
  } catch (error) {
    console.error("Error removing follower:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
