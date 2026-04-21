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

export const allmessages = async (req, res) => {
    try {
        const { chatid } = req.params;
        
        // Frontend se 'page' mangwayenge, default 1 hoga
        const page = parseInt(req.query.page) || 1; 
        const limit = 20; // Ek baar mein sirf 20 messages mangwayenge
        const skip = (page - 1) * limit;

        const messages = await Message.find({ chat: chatid })
            .populate("sender", "name profilepic email")
            .populate("chat")
            .sort({ createdAt: -1 }) // Sabse naye messages pehle (Taki skip sahi kaam kare)
            .skip(skip)
            .limit(limit);

        // Check karne ke liye ki kya aur messages bache hain
        const totalMessages = await Message.countDocuments({ chat: chatid });
        const hasMore = skip + messages.length < totalMessages;

        res.json({
            messages: messages.reverse(), // Reverse taaki UI mein purane upar aur naye niche dikhein
            hasMore,
            totalMessages
        });
    }
    catch (err) {
        res.status(400).json({
            message: err.message
        });
    }
}