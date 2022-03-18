const Product = require('../models/product');
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");

exports.isLoggedIn = BigPromise(async (req, res, next)=>{
    
})
