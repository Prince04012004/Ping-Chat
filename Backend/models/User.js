import mongoose from "mongoose";

const Userschema =new mongoose.Schema({

    phonenumber:{
        type:String,
        required:true,
        unique:true
    },
    name:{
        type:String,
        required:true
    },
    profilepic:{
        type:String,
        default:""
    },
    isOnline:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        default:"Hey i am using chatbox"
    },
    blockedusers:[{
        
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        
    }]


},{timestamps:true})
export default mongoose.model("User",Userschema);