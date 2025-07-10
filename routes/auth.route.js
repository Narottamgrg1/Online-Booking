// auth.route.js
import express from "express";
import { forgotPassword, login, logout, register, resetPassword, verifyEmail } from "../controller/auth.controller.js";

const router = express.Router();

router.post("/register", register);

router.post("/login",login);

router.post("/logout",logout);

router.post("/verify-email", verifyEmail); 


router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


export default router;
