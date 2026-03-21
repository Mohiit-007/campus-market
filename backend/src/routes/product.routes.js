const express = require("express");
const {
    addproduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,        
    deleteAllProducts,    
} = require("../controllers/product.controller");
const verifyAccessToken = require("../middleware/auth.middleware");
const upload = require("../config/cloudinary.config");

const route = express.Router();


route.get('/products', getAllProducts);
route.get('/products/:id', getSingleProduct);

route.post('/products', upload.array('images', 5), verifyAccessToken, addproduct);
route.patch('/products/:id', upload.array('images', 5), verifyAccessToken, updateProduct);
route.delete('/products/:id', verifyAccessToken, deleteProduct);
route.delete('/products', verifyAccessToken, deleteAllProducts);

module.exports = route;