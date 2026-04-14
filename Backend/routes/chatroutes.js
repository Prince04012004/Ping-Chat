import express from "express";
import { accessChat, fetchchats,deleteChat } from "../controller/Chatcontroller.js";
import { auth } from "../middlewares/authmiddleware.js";

 const router=express.Router();

 router.post('/accesschat',auth,accessChat)
 router.get('/chat',auth,fetchchats)
 router.delete("/delete/:chatId", auth, deleteChat);

 export default router;