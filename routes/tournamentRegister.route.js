import express from "express";
import {verifyToken} from "../middleware/verifyToken.js"
import {  cancelRegistration, getRegisterTeam, registerTournament } from "../controller/tournamentRegister.controller.js";

const router = express.Router();

// Apply verifyToken middleware to protected routes
router.post("/registertournament/:tournamentId",verifyToken, registerTournament);

router.delete("/cancelregistration/:registrationId",verifyToken,cancelRegistration)

router.get("/getregisterteam/:tournamentId", getRegisterTeam);

export default router;