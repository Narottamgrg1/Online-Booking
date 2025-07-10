import express from "express";
import { bookResult } from "../controller/result.controller.js";

const router = express.Router();


router.put("/getresult/:bookId",bookResult);



export default router;
