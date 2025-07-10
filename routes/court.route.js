import express from "express";
import { deleteCourt, getCourt, getCourtsByVenueId } from "../controller/court.controller.js";

const router = express.Router();


router.get("/getcourts/:id",getCourtsByVenueId);

router.get("/getcourt/:id",getCourt);

router.delete("/deletecourt",deleteCourt);


export default router;
