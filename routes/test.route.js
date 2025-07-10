import express from "express";
import {  shouldBeAdmin, shouldBeLoggedIn } from "../controller/test.controller.js";
import {verifyToken} from "../middleware/verifyToken.js"

const router = express.Router();

// Apply verifyToken middleware to protected routes
router.get("/shouldbelogged",verifyToken, shouldBeLoggedIn);

router.get("/shouldbeadmin",verifyToken, shouldBeAdmin);



export default router;