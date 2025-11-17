const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderItems: [{
    category: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    default: 0,
  },
  shipping: {
    type: Number,
    required: true,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  orderRemarks: {
    type: String,
    required: true
  },
  destionationAddress: {
    addreslin1: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
  },
  // Customer Information
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["CRED", "CASH", "CARD", "UPI", "NET_BANKING"],
    default: "CRED"
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
    default: "PENDING"
  },
  "orderID": {
    type: String,
    required: true,
  },
  paidAt: {
    type: Date,
    required: true,
  },
  // Status timestamps
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  razorpay_order_id: { 
    type: String 
  },
  razorpay_payment_id: { 
    type: String 
  },
  razorpay_signature: { 
    type: String 
  },
  isCanceled: {
    isCanceled: { type: Boolean, default: false },
    refundStatus: {
      type: String,
      enum: ["processing", "approved", "issued"],
    },
  },
  payment_method: {
    type: String,
    default: "cash",
  },
  paymentStatus: {
    type: String,
    enum: ["success", "failed", "refunded"],
  },
});

module.exports = mongoose.model("Order", orderSchema);