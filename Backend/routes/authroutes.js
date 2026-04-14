import express from "express"
import { signup,sendotp, login} from "../controller/authcontroller.js";
import { auth } from "../middlewares/authmiddleware.js";


const router=express.Router();

router.post("/sendotp",sendotp);
router.post("/signup",signup);
router.post("/login",login)

export default router;


