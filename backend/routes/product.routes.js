const express = require("express");
const {
  getAllProducts,
  getTopShops,
} = require("../controllers/product.controller");

const router = express.Router();

router.get("/api/get-all-products", getAllProducts);
router.get("/api/top-shops", getTopShops);

module.exports = router;
