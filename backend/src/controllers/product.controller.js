const cloudinary = require("cloudinary");
const productmodel = require("../model/product.model");

async function addproduct(req,res) {
try {
    const {title ,description ,category ,condition ,price ,PhoneNumber} = req.body;
    if(!title || !description || !category || !condition || !price){
        return res.status(400).json({msg : "All fields are required"});
    }

    const imageUrls = req.files ? req.files.map(file => file.secure_url) : []; 

    const product = await productmodel.create({
        title,
        description,
        category,
        condition,
        price,
        PhoneNumber,
        seller : req.user.id,
        images : imageUrls,
    })

    res.status(201).json({
        msg : "Product added successfully",
        product,
    })
    
} catch (error) {
    res.status(500).json({
        msg : "Internal Server error",
        error : error.message,
    })
}

}

async function getAllProducts(req,res) {
    try{
        const products = await productmodel.find({ status: "available" })
            .populate('seller', 'name email avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({
            msg : "All products fetched successfully",
            count: products.length,
            products
        });

    }
    catch(error){
        res.status(500).json({
            msg : "Internal Server error",
            error : error.message,
        })
    }
}

async function getSingleProduct(req,res) {
    try {
        const id = req.params.id;
    
        const product = await productmodel.findById(id).populate("seller"," name email avatar");

        if (!product) {
            return res.status(404).json({ msg: "Product not found" });
        }

        res.status(200).json({
            msg : "product fetched successfully",
            product,
        })
    } catch (error) {
        res.status(500).json({
            msg : "Internal Server error",
            error : error.message,
        })
    }
}

function extractPublicId(url) {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    const publicIdWithExtension = parts.slice(uploadIndex + 2).join('/');
    return publicIdWithExtension.replace(/\.[^/.]+$/, '');
}

async function updateProduct(req,res) {
    try {
        const id = req.params.id;
    
        const product = await productmodel.findById(id);

        if (!product) {
            return res.status(404).json({ msg: "Product not found" });
        }

        const userId = req.user.id;

        if(product.seller.toString() != userId.toString()){
            return res.status(403).json({msg : "Unauthorized user"});
        }

        product.title = req.body.title || product.title;
        product.description = req.body.description || product.description;
        product.category = req.body.category || product.category;
        product.condition = req.body.condition || product.condition;
        product.price = req.body.price || product.price;
        product.PhoneNumber = req.body.PhoneNumber || product.PhoneNumber;

        if (req.body.removeImages) {
            const toRemove = JSON.parse(req.body.removeImages);

            for (const url of toRemove) {
                // Delete from Cloudinary so you don't waste storage
                const publicId = extractPublicId(url);
                await cloudinary.v2.uploader.destroy(publicId);
            }

            // Remove those URLs from MongoDB images array
            product.images = product.images.filter(
                img => !toRemove.includes(img)
            );
        }

        if (req.files && req.files.length > 0) {
            const newUrls = req.files.map(file => file.secure_url);
            product.images.push(...newUrls);
        }

        if (product.images.length > 5) {
            return res.status(400).json({ 
                msg: "Maximum 5 images allowed per product" 
            });
        }

        await product.save();

        res.status(200).json({
            msg : "product Updated successfully",
            product
        })

    } catch (error) {
        res.status(500).json({
            msg : "Internal Server error",
            error : error.message,
        })
    }
}

async function deleteProduct(req,res) {
    try {
        const id = req.params.id;
        const product = await productmodel.findById(id);
        if(!product){
            return res.status(404).json({ msg: "Product not found" });
        }

        const userId = req.user.id;

        if(product.seller.toString() != userId.toString()){
            return res.status(403).json({msg : "Unauthorized user"});
        }

        await productmodel.findByIdAndDelete(id);

        res.status(200).json({
            msg : "product deleted successfully",
        })

    } catch (error) {
        res.status(500).json({
            msg : "Internal Server error",
            error : error.message,
        })
    }
}

async function deleteAllProducts(req,res) {
    try {
        const userId = req.user.id;

        await productmodel.deleteMany({seller : userId});

        res.status(200).json({
            msg : "All products deleted successfully",
        })
    } catch (error) {
        res.status(500).json({
            msg : "Internal Server error",
            error : error.message,
        })
    }
}

module.exports = {addproduct ,getAllProducts ,getSingleProduct ,updateProduct, deleteProduct, deleteAllProducts }