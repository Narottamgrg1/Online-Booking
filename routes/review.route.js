import express from "express";
import {verifyToken} from "../middleware/verifyToken.js"
import { deleteReview, getReview, reviewVenue, updateReview } from "../controller/review.controler.js";

const router = express.Router();


router.post("/postReviewAndRating/:venueId",verifyToken,reviewVenue);

router.get("/getReviews/:venueId",getReview);

router.delete("/deleteReview/:reviewId",verifyToken,deleteReview);

router.put("/updateReview/:reviewId",verifyToken,updateReview);



export default router;