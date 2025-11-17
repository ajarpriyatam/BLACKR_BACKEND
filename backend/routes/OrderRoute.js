const express = require("express");
const {
  newOrder,
  getSingleOrder,
  myOrders,
  getAllOrders,
  updateOrderByAdmin,
  orderClearPayment,
  updateOrderStatus,
  paymentVerification
} = require("../controller/OrderCont");
const router = express.Router();

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
router.route("/order/new").post(newOrder);
router.route("/order/:id").get(getSingleOrder);
router.route("/orders/me").get(myOrders);
router.post("/payment-verification", paymentVerification);
router.route("/order/orderClearPayment/:id").post(isAuthenticatedUser, orderClearPayment)
router
  .route("/admin/orders")
  .get(getAllOrders);
router.route("/admin/updateOrderByAdmin/:id").post(isAuthenticatedUser,authorizeRoles("admin"), updateOrderByAdmin)
router.route("/admin/order/status/:id").put(updateOrderStatus)


module.exports = router;