const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name : {
        required : true,
        type : String,
        trim : true,
    },
    email : {
        required : true,
        type : String,
        unique : true,
        lowercase : true,
        trim : true,
    },
    password : {
        required : true,
        type : String,
        minlength : 6,
    },
    verified:{
        type : Boolean,
        default : false,
    },
    googleId: {
        type: String,
        default: null,
    },
    avatar: {
        type: String,
        default: null,
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local",
    },
},{timestamps : true})

const User = mongoose.model("user",UserSchema);

module.exports = User;