import User from "../models/User.js";
import Chat from "../models/Chat.js";

export const searchuser = async (req, res) => {
  try {
    const searchword = req.query.search;

    if (!searchword) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = await User.find({
      $and: [
        //  Name ya Phone dono mein se kuch bhi match kare
        {
          $or: [
            { name: { $regex: searchword, $options: "i" } },
            { phonenumber: { $regex: searchword, $options: "i" } },
          ],
        },
        //Khud ki ID results mein na aaye
        { _id: { $ne: req.user._id } },
        //  Jo blocked hain wo results mein na aaye ($nin = Not In)
        { _id: { $nin: req.user.blockedusers } },
      ],
    });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Search result fail" });
  }
};


//update profile

export const updateprofile=async(req,res)=>{
    const {name,profilepic,status}=req.body;

    try{
        const updateduser=await User.findByIdAndUpdate(
            req.user._id,{
                $set: {
          ...(name && { name }),
          ...(profilepic && { profilepic }),
          ...(status && { status }),
        },
            },
            {new:true}
        )

        if(!updateduser){
            return res.status(404).json({
                message:"User not found"
            })
        }
       
        res.status(200).json(updateduser);




    }
    catch(err){
      res.status(500).json({ message: "Server Error", error: error.message });
    }
}

export const blockuser=async(req,res)=>{
    const {userblockid}=req.body;
    try{
        await User.findByIdAndUpdate(req.user._id,{
            $addToSet:{blockedusers:userblockid} //duplicate not allowed

        });

        await Chat.findOneAndDelete({
         isgroupchat:false,
         users:{$all:[req.user._id,userblockid]}
        });
        res.status(200).send("User blocked")

    }
   catch (error) {
    res.status(400).send(error.message);
  }

};

//get blocked users

export const getblockedusers=async(req,res)=>{
  try{
    const blockusers=await User.findById(req.user._id).populate
    (
      "blockedusers",
      "name profilepic phonenumber"
    )
    if(!blockusers){
      return res.status(404).json(
        {
          message:"User not found"
        }
      )
    }

    res.status(200).json(blockusers.blockedusers);

  }
  catch(err){
    res.status(500).json({
      message:"Server Error",
      error:err.message
    })
  }
}

//unblock the user


export const unblockuser=async(req,res)=>{

  const {userunblockid}=req.body;
  try{
    await User.findByIdAndUpdate(req.user._id,{
      $pull:{blockedusers:userunblockid} //remove from array
    })
  }
catch(err){
    res.status(500).send(err.message);
}    





} 

//profile view

export const getprofile=async(req,res)=>{
  try{
    const userid=req.params._id

    const userprofile=await User.findById(userid).select("-password");

    if(!userprofile){
      return res.status(404).json({
        message:"User not found"
      })
    }
    res.status(200).json(userprofile);
  }
  catch(err){
    res.status(500).json({
      message:err.message
    })
  }
}

