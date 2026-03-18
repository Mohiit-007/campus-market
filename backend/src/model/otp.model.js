const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true,
    },
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref  : "user",
        required : true,
    },
    otpHash : {
        type : String,   
        required : true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600,
    }
});

const Otp = mongoose.model("otp",OtpSchema);

module.exports = Otp;