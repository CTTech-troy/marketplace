import express from "express";
import * as userController from "../controllers/userController.js";

const router = express.Router();

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.get("/profile", userController.getUserProfile);
router.patch("/:id/disable", userController.disableUser);
router.delete("/:id", userController.deleteUser);

export default router;
