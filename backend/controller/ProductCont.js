const Product = require("../models/ProductModel");
const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const cloudinary = require("cloudinary");

exports.createProduct = catchAsyncErrors(async (req, res, next) => {
    let images = [];

    if (typeof req.body.productImageGallery === "string") {
        images.push(req.body.productImageGallery);
    } else {
        images = req.body.productImageGallery;
    }

    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "products",
        });

        imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
        });
    }

    req.body.productImageGallery = imagesLinks;
    console.log(req.body);
    const product = await Product.create(req.body);
    res.status(201).json({
        success: true,
        product,
    });
});
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
    let id = req.params.id;

    // Try to find by ID first, then by slug
    let product = await Product.findById(id);
    if (!product) {
        product = await Product.findOne({ slug: id });
    }

    if (!product) {
        return next(new ErrorHander("Product not Found..", 400))
    }
    res.status(200).json({
        success: true,
        product
    })
});
exports.getAllProductsAdmin = catchAsyncErrors(async (req, res, next) => {
    const ProductAll = await Product.find().select('name price color productImageGallery tokenId category')
    const productsCount = await Product.countDocuments();
    for (let i = 0; i < ProductAll.length; i++) {
        let tempImage = [ProductAll[i].productImageGallery[0]];
        ProductAll[i].productImageGallery = tempImage;
    }
    res.status(200).json({
        success: true,
        ProductAll,
        productsCount
    })
});
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
    try {
        let ProductAll = await Product.find({ display: true })
            .select('name price color productImageGallery')

        for (let i = 0; i < ProductAll.length; i++) {
            let tempImage = [ProductAll[i].productImageGallery[0]];
            ProductAll[i].productImageGallery = tempImage;
        }
        res.status(200).json({
            success: true,
            products: ProductAll,
            productsCount: ProductAll.length
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database connection error',
            error: error.message
        });
    }
});
exports.getTopRatedProducts = catchAsyncErrors(async (req, res, next) => {
    let ProductAll = await Product.find({ tokenId: { $regex: '^A' } })
        .select('name price color productImageGallery')

    for (let i = 0; i < ProductAll.length; i++) {
        let tempImage = [ProductAll[i].productImageGallery[0]];
        ProductAll[i].productImageGallery = tempImage;
    }
    res.status(200).json({
        success: true,
        products: ProductAll,
        productsCount: ProductAll.length
    })
});
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHander("Product not found", 404));
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        product,
    });
});
exports.getProductsByCategory = catchAsyncErrors(async (req, res, next) => {
    const { category } = req.params;
    
    try {
        const products = await Product.find({ 
            category: { $regex: category, $options: 'i' },
            display: true 
        }).select('name price color productImageGallery');

        for (let i = 0; i < products.length; i++) {
            let tempImage = [products[i].productImageGallery[0]];
            products[i].productImageGallery = tempImage;
        }
        
        res.status(200).json({
            success: true,
            products,
            productsCount: products.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database connection error',
            error: error.message
        });
    }
});
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHander("Product not found", 404));
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: "Product Delete Successfully",
    });
});
