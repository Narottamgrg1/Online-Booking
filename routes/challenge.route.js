import express from "express";
// import {  shouldBeAdmin, shouldBeLoggedIn } from "../controller/test.controller.js";
import {verifyToken} from "../middleware/verifyToken.js"
import { acceptChallenge, createChallenge, getChallenge } from "../controller/challenge.controller.js";

const router = express.Router();

// Apply verifyToken middleware to protected routes
router.post("/createChallenge/:bookId",verifyToken, createChallenge);

router.get("/getChallenge/:venueId", getChallenge);

router.put("/updateChallenge/:challengeId",verifyToken,acceptChallenge);



// router.get("/shouldbeadmin",verifyToken, shouldBeAdmin);



export default router;