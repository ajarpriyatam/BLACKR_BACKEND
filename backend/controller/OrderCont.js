const Order = require("../models/OrderModel");
const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

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
    paidAt: Date.now(),
    orderRemarks: "Payment Completed"
  }
  
  const order = await Order.create(orderObj);
  res.status(201).json({
    success: true,
    order
  });
});
exports.updateOrderByAdmin = catchAsyncErrors(async (req, res, next) => {
  const newUserData ={
    logisticAgent:req.body
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
  const newUserData ={
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




