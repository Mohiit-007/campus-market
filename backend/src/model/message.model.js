const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    conversation : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : "conversation",
    },
    sender : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : "user"
    },
    content : {
        type : String,
        required : true,
    },
    read : {
        type : Boolean,
        default : false,
    },
},{timestamps : true});

const Message = mongoose.model("message",messageSchema);

module.exports = Message;