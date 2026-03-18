const mongoose = require("mongoose");

const Sessionschema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user",
        required : [true , "User id required"]
    },
    refreshtoken : {
        type : String,
        required : true,
    },
    ip : {
        type : String,
        required : false,
    },
    userAgent : {
        type : String,
        required : true,
    },
    revoke : {
        type : Boolean,
        default : false,
    },
    revokedAt: {
        type: Date,
        default: null,
        expires: 0, // TTL uses this field's value as expiry time
    }
},{timestamps : true})

const Session = mongoose.model("session",Sessionschema);

module.exports = Session;