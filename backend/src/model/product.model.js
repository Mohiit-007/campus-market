const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    title : {
        type : String,
        required : true,
        trim : true,
    },
    description : {
        type : String,
        required : true,
        trim : true,
    },
    category : {
        type : String,
        enum : ["Books & Notes","Electronics","Bikes","Clothes","Other"],
        required : true,
    },
    condition : {
        type : String,
        enum : ["bad","good","very good"],
        required : true,
    },
    price : {
        type : Number,
        required : true,
    },
    PhoneNumber : {
        type : Number,
        maxlength : 10,
    },
    images : {
        type : [String],
        default : []
    },
    seller : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user",
        required : true,
    },
    status: {
        type: String,
        enum: ["available", "sold"],
        default: "available",
    },
},{timestamps : true})

const Product = mongoose.model("product",productSchema);

module.exports = Product;