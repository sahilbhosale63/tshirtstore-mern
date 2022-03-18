const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        maxlength: [40, 'Name should be under 40 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        validate: [validator.isEmail, 'Please enter email in correct format'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password should be under 8 characters'],
        select: false
    },
    role: {
        type: String,
        default: 'user',
    },
    photo: {
        id: {
            type: String,
            // required: true
        },
        secure_url: {
            type: String,
            // required: true
        }
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// encrypt password before save - HOOKS
userSchema.pre('save', async function(next) {

    if(!this.isModified('password')) 
        return next(); 
    this.password = await bcrypt.hash(this.password, 10);
});

// validate password with passed on user password
userSchema.methods.isPasswordValid = async function(newPassword){
    return await bcrypt.compare(newPassword, this.password);
}


//create and return jwt token
userSchema.methods.getJwtToken = function(){
    return jwt.sign({id: this._id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY,
    });
}

//generate forgot password token (string)
userSchema.methods.getForgotPasswordToken = function(){
    // generate a random and long string
    const forgotToken = crypto.randomBytes(20).toString('hex');

    // getting a hash - make sure to get a hash on backend
    this.forgotPasswordToken = crypto.createHash('sha256').update(forgotToken).digest('hex');

    this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000;

    return forgotToken;
}

module.exports = mongoose.model('User', userSchema);