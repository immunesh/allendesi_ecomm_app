const express = require("express");
const {
  getAllProducts,
  getProductById,
  getTopShops,
} = require("../controllers/product.controller");

const router = express.Router();

router.get("/api/get-all-products", getAllProducts);
router.get("/api/get-product/:id", getProductById);
router.get("/api/top-shops", getTopShops);

module.exports = router;
