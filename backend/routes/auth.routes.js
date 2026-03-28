const express = require("express");
const {
  registerRequest,
  verifyUser,
  loginUser,
  refreshToken,
  forgotPassword,
  changePassword,
  resetPassword,
  verifySmtp,
  updateAvatar,
  socialLogin,
} = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const {
  authGeneralLimiter,
  authSensitiveLimiter,
} = require("../middleware/rateLimit.middleware");

const router = express.Router();

router.post("/api/user-registration", authSensitiveLimiter, registerRequest);
router.post("/api/user-registration/", authSensitiveLimiter, registerRequest);
router.post("/api/registration", authSensitiveLimiter, registerRequest);
router.post("/api/verify-user", authSensitiveLimiter, verifyUser);
router.post("/api/login-user", authSensitiveLimiter, loginUser);
router.post("/api/login-user/", authSensitiveLimiter, loginUser);
router.post("/api/forgot-password", authSensitiveLimiter, forgotPassword);
router.post("/api/reset-password", authSensitiveLimiter, resetPassword);
router.get("/api/verify-smtp", verifySmtp);
router.post("/api/change-password", authGeneralLimiter, requireAuth, changePassword);
router.post("/refresh-token", authSensitiveLimiter, refreshToken);
router.post("/api/update-avatar", requireAuth, updateAvatar);
router.post("/api/social-login", authSensitiveLimiter, socialLogin);

module.exports = router;
