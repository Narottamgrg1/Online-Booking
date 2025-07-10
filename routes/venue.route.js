import express from "express";
import {verifyToken} from "../middleware/verifyToken.js"
import {  addVenue, adminApproval, deleteVenue, getVenue, getVenueByUser, getVenues, getVenuesForAdmin, searchBar, updateVenue } from "../controller/venue.controller.js";

const router = express.Router();

// Define the GET route for fetching sports

router.get("/getvenuesforadmin",getVenuesForAdmin)

router.get("/getVenues", getVenues);

router.get("/getvenue/:id", getVenue);

// Define the GET route for fetching the user's venue
router.get("/getuservenue/:userId", async (req, res) => {
    const { userId } = req.params;
    
    try {
        // Call the getVenueByUser function and pass the userId
        const venue = await getVenueByUser(userId);

        // If venue is found, return it with a 200 status
        res.status(200).json(venue);
    } catch (err) {
        // If an error occurs, return the error message with a 500 status
        res.status(500).json({ message: err.message });
    }
});

// Define the POST route for adding a new sport
router.post("/addVenue",verifyToken, addVenue);

router.put("/update/:id",verifyToken, updateVenue);

router.delete("/delete/:id",verifyToken, deleteVenue);

router.put("/adminaproval/:venueId",verifyToken,adminApproval);

router.get("/search",searchBar);



export default router;
