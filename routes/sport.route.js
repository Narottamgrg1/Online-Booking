import express from "express";
import { sport, addSport, deleteSports } from "../controller/sport.controller.js";  // Import the functions
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Define the GET route for fetching sports
router.get("/getSport", sport);

// Define the POST route for adding a new sport
router.post("/addSport", addSport);

router.post("/deletesports",verifyToken,deleteSports);

export default router;
