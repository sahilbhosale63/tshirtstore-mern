const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        maxlength: [100, 'Name should be under 100 characters'],
        trim: true,
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        maxlength: [5, 'Price should be upto 5 digits long']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        minlength: [20, 'Description length should be min 20 words'],
        maxlength: [300, 'Description length should be under 300 words'],
    },
    photos: [
        {
            id: {
                type: String,
                required: true
            },
            secure_url: {
                type: String,
                required: true
            }
        }
    ],
    category: {
        type: String,
        required: [true, 'Please choose category'],
        enum: {
            values: [
                'shortsleeves', 'longsleeves', 'sweatshirt', 'hoodies'],
            message: 'please select category ONLY from short-sleeves, long-sleeves, sweat-shirt, hoodies'
        }
    },
    brand: {
        type: String,
        required: [true, 'Brand Name is required'],
        maxlength: [80, 'Brand Name should be under 80 characters']
    },
    ratings: {
        type: Number,
        default: 0
    },
    numberOfReviews: {
        type: Number,
        default: 0
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            name: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true
            },
            comment: {
                type: String,
                required: true
            },
        }
    ],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);