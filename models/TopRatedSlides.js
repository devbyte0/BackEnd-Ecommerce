const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TopRatedSlidesSchema = new mongoose.Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number
    },
    discountPrice: {
        type: Number
    },
    imageUrl: {
        type: String,
        required: true
    },
    mainBadgeName: {
        type: String
    },
    mainBadgeColor: {
        type: String
    },
    rating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model("TopRatedSlides", TopRatedSlidesSchema);
