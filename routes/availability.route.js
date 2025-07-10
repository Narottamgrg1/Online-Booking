import exrpess from "express";
import {verifyToken} from "../middleware/verifyToken.js"
import {  genavailabilityForUpdate, generateAvailabilityForVenue, getAvailabilities, getAvailabilitiesbyBody, getAvailabilitiesbyBodyForManager, updateAvailabilities, updateVenueTime } from "../controller/availability.controller.js";

const router=exrpess.Router();

router.post("/genavailability",generateAvailabilityForVenue);

router.get("/getavailability/:venueId",getAvailabilities);

router.post("/getavailabilitiesbybody/:venueId",getAvailabilitiesbyBody);

router.post("/getavailabilitiesbybodyformanager/:venueId",getAvailabilitiesbyBodyForManager);

router.post("/genavailabilityforupdate/:venueId",genavailabilityForUpdate);

router.put("/updateavailabilities/:venueId", verifyToken, updateAvailabilities);

router.put("/updatevenuetime/:venueId", updateVenueTime);

export default router;