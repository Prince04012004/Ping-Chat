import express from "express";
import { generateTheme } from "../controller/aicontroller.js"; // .js lagana zaroori hai ESM mein
import { auth } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.post("/generate-theme", auth, generateTheme);

export default router;