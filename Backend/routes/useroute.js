import express from "express"
import { searchuser, updateprofile,blockuser,getblockedusers ,unblockuser, getprofile} from "../controller/userController.js";
import { auth } from "../middlewares/authmiddleware.js";


const router=express.Router();
router.get("/searchuser",auth,searchuser)
router.put("/updateprofile", auth, updateprofile);
router.post("/block", auth, blockuser);
router.get("/getblockedusers",auth,getblockedusers)
router.post("/unblockuser",auth,unblockuser)
router.get("/getprofile/:_id",auth,getprofile)
export default router;
