const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter product Name"],
  },
  category: {
    type: String,
    required: [true, "Please Enter product category"],
  },
  price: {
    type: Number,
    required: [true, "Please Enter product Price"],
  },
  color: {
    type: String,
    required: [true, "Please Enter product color"],
  },
  tokenId: {
    type: String,
    required: [true, "Please Enter product tokeId"],
  },
  description: {
    type: String,
    required: [true, "Please Enter product description"],
  },
  display: {
    type: Boolean,
    required: [true, "Please Enter product display status"],
  },
  productImageGallery: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = new mongoose.model("Product", productSchema);
module.exports = Product