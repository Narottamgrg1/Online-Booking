import express from "express";
import {verifyToken} from "../middleware/verifyToken.js"
import { cancelBook, createBooking, getbookingForManager, getBookingById, getBookingByUserId, getWeeklyTimeSlotStats, verifyBook } from "../controller/book.controller.js";

const router=express.Router();

router.post("/reserve/:venueId",verifyToken,createBooking);

router.put("/verify/:venueId",verifyToken,verifyBook);

router.put("/cancel/:bookingId",verifyToken,cancelBook)

router.post("/getbooking/:venueId",getbookingForManager)

router.post("/getbookingforpie/:venueId",getWeeklyTimeSlotStats)

router.get("/getbookingbyid/:bookingId",getBookingById)

router.get("/getbookingbyuserid",verifyToken,getBookingByUserId)


export default router;