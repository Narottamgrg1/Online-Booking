import express from "express";
import {verifyToken} from "../middleware/verifyToken.js"
import { createLoyalty, getLoyalty, getLoyaltyForVenue, getLoyaltyOfUser, redeemLoyalty } from "../controller/loyalty.controller.js";

const router = express.Router();

// Apply verifyToken middleware to protected routes
router.post("/createloyalty",verifyToken, createLoyalty);

router.put("/redeemloyalty/:venueId/:courtId",verifyToken,redeemLoyalty);

router.get("/getloyaltyofuser",verifyToken,getLoyaltyOfUser);

router.get("/getloyaltyforvenue/:venueId",verifyToken,getLoyaltyForVenue);

router.get("/getloyalty/:venueId",getLoyalty);

export default router;