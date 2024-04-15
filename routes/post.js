const mongoose = require("mongoose")

const postschema = mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  },
  title:String,
  description:String,
  postimage:String,
  createat:{
    type: Date,
    default: Date.now 
  },
  likes:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    },
    comment: String,
   }]
  
})

module.exports = mongoose.model("post",postschema)