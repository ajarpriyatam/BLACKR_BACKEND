const express = require("express");
const {
  getAllProducts,
  createProduct,
  getProductDetails,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
  getTopRatedProducts,
  getProductsByCategory,
  getNewArrivals
} = require("../controller/ProductCont");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.route("/admin/products").get(getAllProductsAdmin);
router.route("/products").get(getAllProducts);
router.route("/products/top").get(getTopRatedProducts);
router.route("/products/category/:category").get(getProductsByCategory);
router.route("/product/:id").get(getProductDetails);
router
  .route("/admin/product/new")
  .post(createProduct);
  // .post(isAuthenticatedUser,authorizeRoles("admin"), createProduct);

router
  .route("/admin/product/:id")
  // .put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct)
  .delete(deleteProduct);
  // .put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct)
  // .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);
module.exports = router;