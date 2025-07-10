import express from "express";
import {verifyToken} from "../middleware/verifyToken.js"
import { createTournament, deleteTournament, getTournament, getTournamentById, getTournamentsByUserId, updateTournament } from "../controller/tournament.controller.js";

const router = express.Router();

// Apply verifyToken middleware to protected routes
router.post("/create/:venueId", createTournament);

router.get("/gettournamentbyid/:venueId", getTournamentById);

router.get("/gettournament", getTournament);

router.get("/gettournamentbyuserid",verifyToken, getTournamentsByUserId);

router.put("/update/:tournamentId",updateTournament);

router.delete("/delete/:tournamentId",deleteTournament);

export default router;