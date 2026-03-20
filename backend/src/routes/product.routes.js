const express = require("express");
const multer = require("multer");
const {addproduct} = require("../controllers/product.controller");
const authmidlleware = require("../middleware/auth.middleware")

const route = express.Router();

const multer = {}

route.post('/addproduct',authmidlleware,addproduct);

module.exports = route;