import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { 
    allUsers,
  deleteUser, 
  deleteUsersByAdmin, 
  getUser,  
  updateUser 
} from "../controller/user.controller.js";

const router = express.Router();

// Route to get a single user by ID (authenticated users can access their profile)
router.get("/getuser/:id", verifyToken, getUser);

// Route to get all users (restricted to admin only)
router.get("/getusers", allUsers); // Ensure only admins can access this route

// Route to update a user by ID (authenticated users can update their profile)
router.put("/:id", verifyToken, updateUser);

// Route to delete a user by ID (authenticated users can delete their profile)
router.delete("/:id", verifyToken, deleteUser);

// Route to delete a user by ID (admin-only route)
router.post("/admin", verifyToken, deleteUsersByAdmin);

export default router;
