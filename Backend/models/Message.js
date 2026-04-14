import mongoose from "mongoose";

const messageSchema=new mongoose.Schema({
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",

    },
    // the user typing the message
    content:{
        type:String,
        trim:true,
        required:true
    },
    //for chat id

    chat:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Chat"

    },
    aisuggestion:{
        type:String,
        default:""
    },

    readby:[{
           type:mongoose.Schema.Types.ObjectId,
           ref:"User"
    }]
},{
    timestamps:true
})
export default mongoose.model("Message",messageSchema)