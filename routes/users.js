const mongoose = require("mongoose")
const plm = require("passport-local-mongoose")

    mongoose.connect("mongodb://127.0.0.1:27017/newpinterestclone")

const userschema = mongoose.Schema({
  email:String,
  fullname:String,
  username:String,
  password:String,
  profilepicture:String,
  bio:String, 
  posts:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"post"
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  }],
  
})
userschema.plugin(plm)
module.exports = mongoose.model("user",userschema)