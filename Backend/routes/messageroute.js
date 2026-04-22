import express from "express"
import { allmessages, sendMessage,deleteMessage } from "../controller/Messagecontroller.js"
import { auth } from "../middlewares/authmiddleware.js"




const router=express.Router()

router.post('/sendmessage',auth,sendMessage);
router.get('/allmessages/:chatid',auth,allmessages)
router.delete("/deletemessage/:messageId", auth, deleteMessage);

export default router;