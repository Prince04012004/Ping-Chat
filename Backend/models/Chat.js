import mongoose from "mongoose";

const chatSchema=new mongoose.Schema({
    chatname:{
        type:String,
        trim:true
    },
    users:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    lastmessage:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Message"
    },
    isgroupchat:{
        type:Boolean,
        default:false
    }
},
{
    timestamps:true
})

export default mongoose.model("Chat",chatSchema)