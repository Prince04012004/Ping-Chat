import express from "express";
import { signup, login, sendOTP } from "../controller/authcontroller.js";

const router = express.Router();

router.post("/sendotp", sendOTP);
router.post("/signup", signup);
router.post("/login", login);

export default router;