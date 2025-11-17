const Order = require("../models/OrderModel");
const ErrorHander = require("../utils/errorhander");
const crypto = require("crypto");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const axios = require("axios");

exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    orderItems,
    destionation_address,
    subtotal,
    shipping,
    total,
    name,
    email,
    phone,
    paymentMethod,
  } = req.body;

  // Generate order ID in format ORD-XXXXXXXX
  const generateOrderId = () => {
    const randomNum = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `ORD-${randomNum}`;
  };

  let order_id = generateOrderId();

  let orderObj = {
    orderItems: orderItems,
    subtotal: subtotal,
    shipping: shipping,
    total: total,
    destionationAddress: destionation_address,
    name: name,
    email: email,
    phone: phone,
    paymentMethod: paymentMethod || "CRED",
    orderID: order_id,
  }

  const order = await Order.create(orderObj);
  res.status(201).json({
    success: true,
    order
  });
});
exports.updateOrderByAdmin = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    logisticAgent: req.body
  };
  const order = await Order.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    order
  });
});
exports.orderClearPayment = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    clearPaymentDate: req.body.date,
    orderRemarks: "Payment Completed"
  };
  const order = await Order.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    order
  });
});
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHander("Order not found with this Id", 404));
  }
  res.status(200).json({
    success: true,
    order,
  });
});

exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });
  res.status(200).json({
    success: true,
    orders,
  });
});

exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find();
  let totalAmount = 0;
  orders.forEach((order) => {
    totalAmount += order.total;
  });
  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

exports.updateOrderStatus = catchAsyncErrors(async (req, res, next) => {
  const { status, remarks } = req.body;
  const orderId = req.params.id;

  // Valid status values
  const validStatuses = [
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  if (status && !validStatuses.includes(status)) {
    return next(new ErrorHander("Invalid order status", 400));
  }

  const updateData = {};

  if (status) {
    updateData.orderStatus = status;
  }

  if (remarks) {
    updateData.orderRemarks = remarks;
  }

  // Add timestamp based on status
  switch (status) {
    case "PROCESSING":
      updateData.processingAt = new Date();
      break;
    case "SHIPPED":
      updateData.shippedAt = new Date();
      break;
    case "DELIVERED":
      updateData.deliveredAt = new Date();
      break;
    case "CANCELLED":
      updateData.cancelledAt = new Date();
      break;
  }

  const order = await Order.findByIdAndUpdate(
    orderId,
    updateData,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  if (!order) {
    return next(new ErrorHander("Order not found with this Id", 404));
  }

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    order,
  });
});

exports.paymentVerification = catchAsyncErrors(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const { orderId } = req.query;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new ErrorHander("Missing payment verification parameters", 400));
  }

  // Verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");
  
  const isAuthentic = expectedSignature === razorpay_signature;

  // Find order by orderId from query or by razorpay_order_id
  let order;
  if (orderId) {
    order = await Order.findById(orderId);
  } else {
    // Try to find by orderID field if razorpay_order_id matches
    order = await Order.findOne({ orderID: razorpay_order_id });
  }

  if (!order) {
    return next(new ErrorHander("Order not found", 404));
  }

  if (isAuthentic) {
    try {
      // Verify payment with Razorpay API
      const razorpayApiResponse = await axios.get(
        `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
        {
          auth: {
            username: process.env.RAZORPAY_API_KEY,
            password: process.env.RAZORPAY_KEY_SECRET,
          },
        }
      );

      // Update order with payment verification details
      const updateData = {
        paidAt: new Date(),
        orderRemarks: `Payment verified via Razorpay. Payment ID: ${razorpay_payment_id}`,
        paymentMethod: razorpayApiResponse?.data?.method?.toUpperCase() || "CARD",
      };

      // Store Razorpay details in orderRemarks or add to a notes field
      const updatedOrder = await Order.findByIdAndUpdate(
        order._id,
        updateData,
        { new: true, runValidators: true }
      );

      // Redirect to success page if CLIENT_URL is set, otherwise return JSON
      if (process.env.CLIENT_URL) {
        return res.redirect(
          `${process.env.CLIENT_URL}/success/${updatedOrder._id}`
        );
      }

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        order: updatedOrder,
      });
    } catch (apiError) {
      return next(new ErrorHander("Failed to verify payment with Razorpay", 500));
    }
  } else {
    // Invalid signature - update order as failed
    await Order.findByIdAndUpdate(
      order._id,
      {
        orderRemarks: "Payment verification failed - Invalid signature",
      },
      { new: true }
    );

    return next(new ErrorHander("Invalid payment signature", 400));
  }
});




