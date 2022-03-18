const BigPromise = require("../middlewares/bigPromise");
const Product = require('../models/product');
const cloudinary = require('cloudinary').v2;
const CustomError = require("../utils/customError");


exports.addProduct = BigPromise(async (req, res, next) => {

    const imagesArr = [];
    
    if(!req.files){
        return next(new CustomError('Images are required...', 401));
    }

    if(req.files){
        for(let i=0; i< req.files.photos.length; i++) {
            
            let result = await cloudinary.uploader.upload(req.files.photos[i].tempFilePath, {
                folder: "tshirtstore/products",
                width: 150,
                crop: "scale"
            });

            imagesArr.push(
                {
                    id: result.public_id,
                    secure_url: result.secret_url
                }
            )
        }
    }

    req.body.photos = imagesArr;
    req.body.user = req.user.id;

    const {name, price, description, category, brand} = req.body;
    
    // if(!name || !price || !description || !category || !brand){
    //     console.log(name, price, description, category, brand)
    //     return next(new CustomError('name, price, description, category, brand.', 400));
    // }


    // const product = await Product.create({
    //     name, price, description, category, brand
    // });
    const product = await Product.create(req.body);

    res.status(200).json({
        success: true,
        product
    })
    
});

exports.getAllProducts = BigPromise(async (req, res, next) => {

    const resultPerPage = 6;

    const products = new WhereClause(Product.find(), req.query).search().filter();

    const filteredProductNumber = products.length;
    const totalProductCount = await Product.countDocuments();

    products.pager(resultPerPage);
    products = await products.base;

    res.status(200).json({
        success: true,
        products,
        filteredProductNumber,
        totalProductCount
    })
    
});

exports.getOneProduct = BigPromise(async (req, res, next) => {

    const product = await Product.findById(req.params.id);

    if(!product){
        return next(new CustomError('No product found with this id', 401))
    }

    res.status(200).json({
        success: true,
        product
    })
    
});

exports.addReview = BigPromise(async (req, res, next) => {

    const {rating, comment, productId} = req.body;

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number[rating],
        comment
    }

    const product = await Product.findById(productId);

    const productAlreadyReviewed = product.reviews.find(rev=>{
        rev.user.toString() === req.user._id.toString();
    });

    if(productAlreadyReviewed){
        product.reviews.forEach(review =>{
            if(review.user.toString() === req.user._id.toString()){
                review.comment = comment;
                review.rating = rating;
            }
        });
    }
    else{
        product.reviews.push(review);
        product.numberOfReviews = product.reviews.length;
    }


    product.ratings = product.reviews.reduce((acc, item)=>{
        (item.rating + acc, 0)/product.reviews.length;
    });

    await product.save({validateBeforeSave: false});

    res.status(200).json({
        success: true
    })
    
});

exports.deleteReview = BigPromise(async (req, res, next) => {

    const {productId} = req.query;

    const product = await Product.findById(productId);

    const reviews= product.reviews.filter(rev=>{
        rev.user.toString() === req.user._id.toString();
    });


    const numberOfReviews = reviews.length;

    product.ratings = product.reviews.reduce((acc, item)=>{
        (item.rating + acc, 0)/product.reviews.length;
    });

    await Product.findByIdAndUpdate(productId, {
        reviews,
        ratings,
         numberOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });


    res.status(200).json({
        success: true
    })
    
});

exports.getOnlyReviewsForOneProduct = BigPromise(async (req, res, next) => {

    const product = await Product.findById(req.query.id);


    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
    
});




exports.adminGetAllProducts = BigPromise(async (req, res, next) => {

    const products = await Product.find();

    res.status(200).json({
        success: true,
        products
    })
    
});


exports.adminUpdateOneProduct = BigPromise(async (req, res, next) => {

    let product = await Product.findById(req.params.id);
    let imagesArr = [];

     if(!product){
        return next(new CustomError('No product found with this id', 401))
    }

    if(req.files){

        //destroy the existing images
        for(let i=0; i< product.photos.length; i++){
            const res = await cloudinary.uploader.destroy(product.photos[i].id);
        }

        //upload and save the images
        for(let i=0; i< req.files.photos.length; i++) {
            
            let result = await cloudinary.uploader.upload(req.files.photos[i].tempFilePath, {
                folder: "tshirtstore/products", // this folder name can be added to env file
                width: 150,
                crop: "scale"
            });

            imagesArr.push({
                id: result.public_id,
                secure_url: result.secret_url
            });
        }
    }

    req.body.photos = imagesArr;
    product = await Product.findById(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true,
        product
    })
    
});


exports.adminDeleteOneProduct = BigPromise(async (req, res, next) => {

    const product = await Product.findById(req.params.id);

     if(!product){
        return next(new CustomError('No product found with this id', 401))
    }

    //destroy the existing images
    for(let i=0; i< product.photos.length; i++){
        await cloudinary.uploader.destroy(product.photos[i].id);
    }

    await product.remove();

    res.status(200).json({
        success: true,
        message: 'Product was deleted !'
    })
    
});