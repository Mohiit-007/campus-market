const productmodel = require("../model/product.model");
const usermodel = require("../model/user.model");

async function addproduct(req,res) {
try {
    const {title ,description ,category ,condition ,price ,PhoneNumber} = req.body;
    if(!title || !description || !category || !condition || !price){
        return res.status(400).json({msg : "All fields are required"});
    }

    const product = await productmodel.create({
        title,
        description,
        category,
        condition,
        price,
        PhoneNumber,
        seller : req.user.id,
        images : [],
    })

    res.status(200).json({
        msg : "Product added",
        product,
    })
    
} catch (error) {
    res.status(500).json({
        msg : "Internal Server error",
        error : error.message,
    })
}

}

module.exports = {addproduct}