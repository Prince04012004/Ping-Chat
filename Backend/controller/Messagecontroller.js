import User from "../models/User.js";
import Message from "../models/Message.js"
import Chat from "../models/Chat.js";

export const sendMessage=async(req,res)=>{
    const {content,chatid}=req.body;

    if(!content||!chatid){
        return res.status(400).json({
            message:"Content and Chat id requred"
        })
    }

    var newmessage=
    {
        sender:req.user._id,
        content:content,
        chat:chatid
    }

    try{
        var message=await Message.create(newmessage);
        message=await message.populate("sender","name profilepic");
        message=await message.populate("chat")
        message=await User.populate(message,{
            path:"chat.users",
            select:"name profilepic phonenumber"
        })
        await Chat.findByIdAndUpdate(req.body.chatid,{lastmessage:message});

        res.json(message)
    }
    catch(err){
       res.status(400).json({ message: err.message });
    }




}

// all messages

export const allmessages=async(req,res)=>{
    try{
        const {chatid}=req.params;

        const message=await Message.find({chat:chatid})
        .populate("sender","name profilepic phonenumer")  //sender info
        .populate("chat")
        
        res.json(message);
    }
    catch(err){
        res.status(400).json({
            message:err.message
        })
    }
}