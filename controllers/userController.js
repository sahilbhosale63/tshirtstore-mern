const User = require('../models/user');
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cookieToken = require('../utils/cookieToken')
const mailHelper = require('../utils/emailHelper');
const crypto = require('crypto');
const user = require('../models/user');
const cloudinary = require('cloudinary').v2;

exports.signup = BigPromise(async (req, res, next) => {

    if(!req.files){
        return next(new CustomError('Photo is required.', 400));
    }

    const {name, email, password} = req.body;
    
    if(!email || !name || !password){
        return next(new CustomError('Name, Email and Password is required.', 400));
    }

    let file = req.files.photo;
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "tshirtstore/users",
        width: 150,
        crop: "scale"
    });

    const user = await User.create({
        name, email, password,
        photo: {
            id: result.public_id,
            secure_url: result.secure_url
        }
    });

    cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) =>{

    const {email, password} = req.body;
    
    if(!email || !password){
        return next(new CustomError('Email and Password is required.', 400));
    }

    // get user from db
   const user = await User.findOne({email}).select("+password");

   // if user not found in db
   if(!user){
        return next(new CustomError('Email or password does not match or exist.', 400));
   }
    
   const isPasswordCorrect = await user.isPasswordValid(password);
    if(!isPasswordCorrect){
        return next(new CustomError('Email or password does not match or exist.', 400));
    }

    // if all is good then send cookie token
    cookieToken(user, res);                                                                           
})

exports.logout = BigPromise(async (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: "Logout Success..."
    })
})

exports.forgotPassword = BigPromise(async (req, res, next) => {
    
    const {email} = req.body;

    if(!email){
        return next(new CustomError('Email is required to reset password.', 400));
    }

    // get user from db
   const user = await User.findOne({email});

   // if user not found in db
   if(!user){
    return next(new CustomError('User does not match or exist in DB.', 400));
    }

    const forgotToken = user.getForgotPasswordToken();

    await user.save({validateBeforeSave: false});

    const myUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${forgotToken}`;

    const message = `Copy paste this link in your browser and hint enter \n\n ${myUrl}`;

    // attempt to send email
    try{
        await mailHelper({
            email: user.email,
            subject: "Reset Password email",
            message: message
        })

        res.status(200).json({
            succes: true,
            message: "Email send successfully..."
        })
    }catch(error){
        user.getForgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save({validateBeforeSave: false});

        return next(new CustomError(error.message, 500));
    }
})

exports.passwordReset = BigPromise(async (req, res, next) => {
    
    const token = req.params.token;

    const encryptToken = crypto.createHash('sha256').update(token).digest('hex');


    const user = await User.findOne({encryptToken,
        forgotPasswordExpiry: {$gt: Date.now()}
    });

    if(!user){
        return next(new CustomError('Token is invalid or expired...'));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new CustomError('Password does not match...'));
    }

    user.password = req.body.password;
    user.getForgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save();

    // if all is good then send cookie token
    cookieToken(user, res);
})

exports.getLoggedInUserDetails = BigPromise(async (req, res, next)=>{
    const user = await User.findById(req.user.id)  

    res.status(200).json({
        success: true,
        user
    })
})

exports.changePassword = BigPromise(async (req, res, next)=>{
    
    const userId = req.user.id;

    const user = await User.findById(userId).select("+password");

    const isOldPasswordCorrect = await user.isPasswordValid(req.body.oldPassword);

    if(!isOldPasswordCorrect){
        return next(new CustomError('Old password does not match. It\'s incorrect'));
    }

    user.password = req.body.newPassword;

    await user.save();

    cookieToken(user, res);
})


exports.updateUserDetails = BigPromise(async (req, res, next)=>{
    
    const userId = req.user.id;

    const newData = {
        name: req.body.name,
        email: req.body.email
    };
    
    if(req.files){
        const user = User.findById(userId);
        const photoId = user.photo.id;

        //delete photo on cloudinary
        const response = await cloudinary.uploader.destroy(photoId);  

        //upload new photo on cloudinary
        const result = await cloudinary.uploader.upload(req.files.photo.tempFilePath, {
            folder: "tshirtstore/users",
            width: 150,
            crop: "scale"
        });

        newData.photo = {
            id: result.public_id,
            secure_url: result.secure_url
        }
    }

    const user = await User.findByIdAndUpdate(userId, newData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        succes: true
    })


    await user.save();

    cookieToken(user, res);
})

exports.adminAllUsers = BigPromise(async (req, res, next)=>{
    
    const users = await User.find();

    res.status(200).json({
        succes: true,
        users
    })
})

exports.adminGetSingleUser = BigPromise(async (req, res, next)=>{
    
    const userId = req.params.id;
    const users = await User.findById(userId);

    if(!users){
        return next(new CustomError('No user found...', 400));
    }

    res.status(200).json({
        success: true,
        users  
    })
})

exports.adminUpdateSingleUser = BigPromise(async (req, res, next)=>{
    
    const userId = req.params.id;

    const newData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    };

    const user = await User.findByIdAndUpdate(userId, newData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    })

    res.status(200).json({
        success: true,
        user  
    })
})


exports.adminDeleteSingleUser = BigPromise(async (req, res, next)=>{
    
    const userId = req.params.id;

    const user = await User.findById(userId);

    if(!user){
        return next(new CustomError('No user found...', 401));
    }

    const imageId = user.photo.id;

    await cloudinary.uploader.destroy(imageId);

    await user.remove();

    res.status(200).json({
        success: true
    })
})


exports.managerAllUsers = BigPromise(async (req, res, next)=>{
    
    const users = await User.find({role: 'user'});

    res.status(200).json({
        succes: true,
        users
    })
})