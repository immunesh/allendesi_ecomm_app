const express = require("express");
const {
  getRecommendationProducts,
} = require("../controllers/recommendation.controller");

const router = express.Router();

router.get("/api/get-recommendation-products", getRecommendationProducts);

module.exports = router;
