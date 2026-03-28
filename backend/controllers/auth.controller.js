const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const {
  sendOtpVerificationEmail,
  sendResetPasswordEmail,
  verifySmtpConnection,
} = require("../services/mail.service");

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const generateOtp = () => `${Math.floor(1000 + Math.random() * 9000)}`;

const signAccessToken = (userId) =>
  jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET || "access-secret-dev",
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" },
  );

const signRefreshToken = (userId) =>
  jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET || "refresh-secret-dev",
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" },
  );

const validateRegistrationInput = ({ name, email, password }) => {
  if (!name || name.trim().length < 3) {
    return "Name must be at least 3 characters";
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return "Please enter a valid email";
  }
  if (!password || password.length < 6) {
    return "Password must be at least 6 characters";
  }
  return null;
};

const verifyAndUpgradePassword = async (userId, inputPassword, storedPassword) => {
  const normalizedStoredPassword = String(storedPassword ?? "").trim();
  const normalizedInputPassword = String(inputPassword ?? "");
  const isBcryptHash = normalizedStoredPassword.startsWith("$2");

  if (isBcryptHash) {
    return bcrypt.compare(normalizedInputPassword, normalizedStoredPassword);
  }

  const isPlainTextMatch = normalizedInputPassword === normalizedStoredPassword;

  if (!isPlainTextMatch) {
    return false;
  }

  const hashedPassword = await bcrypt.hash(normalizedInputPassword, 10);
  await pool.execute("UPDATE users SET password = ? WHERE id = ?", [
    hashedPassword,
    userId,
  ]);

  return true;
};

const ensurePasswordResetTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      email VARCHAR(150) NOT NULL,
      token_hash VARCHAR(255) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_password_reset_email (email),
      INDEX idx_password_reset_expires (expires_at)
    )
  `);
};

const registerRequest = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const validationError = validateRegistrationInput({ name, email, password });

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already exist with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();

    await pool.execute("DELETE FROM otp_verifications WHERE email = ?", [
      normalizedEmail,
    ]);

    await pool.execute(
      `
        INSERT INTO otp_verifications (name, email, password, otp, expires_at)
        VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
      `,
      [name.trim(), normalizedEmail, hashedPassword, otp],
    );

    try {
      await sendOtpVerificationEmail({
        to: normalizedEmail,
        name: name.trim(),
        otp,
      });
    } catch (mailError) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to process registration request",
      error: error.message,
    });
  }
};

const verifyUser = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!otp || `${otp}`.trim().length !== 4) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const validationError = validateRegistrationInput({ name, email, password });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already exist with this email",
      });
    }

    const [otpRows] = await pool.execute(
      `
        SELECT id, name, email, password, otp, expires_at
        FROM otp_verifications
        WHERE email = ?
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [normalizedEmail],
    );

    if (otpRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    const otpRecord = otpRows[0];
    const isExpired = new Date(otpRecord.expires_at).getTime() < Date.now();

    if (isExpired || otpRecord.otp !== `${otp}`.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or signup data",
      });
    }

    const [insertResult] = await pool.execute(
      `
        INSERT INTO users (name, email, password, is_verified)
        VALUES (?, ?, ?, 1)
      `,
      [otpRecord.name, otpRecord.email, otpRecord.password],
    );

    await pool.execute("DELETE FROM otp_verifications WHERE email = ?", [
      normalizedEmail,
    ]);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      userId: insertResult.insertId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify user",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await pool.execute(
      "SELECT id, name, email, password, avatar_url, avatar_file_id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];
    const isPasswordValid = await verifyAndUpgradePassword(
      user.id,
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar_url
          ? {
              url: user.avatar_url,
              file_id: user.avatar_file_id,
            }
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to login user",
      error: error.message,
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const tokenFromBody = req.body?.refreshToken;
    const authHeader = req.headers.authorization || "";
    const tokenFromHeader = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const token = tokenFromBody || tokenFromHeader;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token is required" });
    }

    const decoded = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET || "refresh-secret-dev",
    );

    const newAccessToken = signAccessToken(decoded.userId);

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter a valid email" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await pool.execute(
      "SELECT id, email FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );

    // Return generic success response to avoid user enumeration.
    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, a reset link has been sent",
      });
    }

    await ensurePasswordResetTable();

    const user = users[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    await pool.execute("DELETE FROM password_reset_tokens WHERE user_id = ?", [
      user.id,
    ]);

    await pool.execute(
      `
        INSERT INTO password_reset_tokens (user_id, email, token_hash, expires_at)
        VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))
      `,
      [user.id, user.email, tokenHash],
    );

    const encodedEmail = encodeURIComponent(user.email);
    const resetLink =
      (process.env.RESET_PASSWORD_URL ||
        "http://localhost:8081/(routes)/change-password") +
      `?email=${encodedEmail}&token=${resetToken}`;

    let emailSent = false;
    try {
      await sendResetPasswordEmail({ to: user.email, resetLink });
      emailSent = true;
    } catch (mailError) {
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({
          success: false,
          message: "Failed to send reset email",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: emailSent
        ? "Password reset link sent successfully"
        : "Reset link generated (SMTP not configured)",
      ...(process.env.NODE_ENV !== "production" && {
        resetToken,
        resetLink,
        email: user.email,
      }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to process forgot password request",
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter a valid email" });
    }

    if (!token || `${token}`.trim().length < 32) {
      return res
        .status(400)
        .json({ success: false, message: "Reset token is required" });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    await ensurePasswordResetTable();

    const normalizedEmail = email.trim().toLowerCase();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const [tokenRows] = await pool.execute(
      `
        SELECT id, user_id, expires_at
        FROM password_reset_tokens
        WHERE email = ? AND token_hash = ?
        LIMIT 1
      `,
      [normalizedEmail, tokenHash],
    );

    if (tokenRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const resetRecord = tokenRows[0];
    const isExpired = new Date(resetRecord.expires_at).getTime() < Date.now();

    if (isExpired) {
      await pool.execute("DELETE FROM password_reset_tokens WHERE id = ?", [
        resetRecord.id,
      ]);
      return res.status(400).json({
        success: false,
        message: "Reset token expired",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      resetRecord.user_id,
    ]);

    await pool.execute("DELETE FROM password_reset_tokens WHERE user_id = ?", [
      resetRecord.user_id,
    ]);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message,
    });
  }
};

const verifySmtp = async (req, res) => {
  try {
    const result = await verifySmtpConnection();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify SMTP",
      error: error.message,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const [users] = await pool.execute(
      "SELECT id, password FROM users WHERE id = ? LIMIT 1",
      [req.userId],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];
    const isPasswordValid = await verifyAndUpgradePassword(
      user.id,
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      req.userId,
    ]);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message,
    });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const { url, file_id } = req.body;

    if (!url || !file_id) {
      return res.status(400).json({
        success: false,
        message: "Avatar url and file_id are required",
      });
    }

    await pool.execute(
      "UPDATE users SET avatar_url = ?, avatar_file_id = ? WHERE id = ?",
      [url, file_id, req.userId],
    );

    const [users] = await pool.execute(
      "SELECT id, name, email, avatar_url, avatar_file_id FROM users WHERE id = ? LIMIT 1",
      [req.userId],
    );

    const user = users[0];

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar_url
          ? {
              url: user.avatar_url,
              file_id: user.avatar_file_id,
            }
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update avatar",
      error: error.message,
    });
  }
};

const socialLogin = async (req, res) => {
  try {
    const { provider, accessToken } = req.body;

    if (!provider || !accessToken) {
      return res.status(400).json({
        success: false,
        message: "Provider and access token are required",
      });
    }

    const allowedProviders = ["google", "facebook"];
    if (!allowedProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported provider",
      });
    }

    let socialUser = null;

    if (provider === "google") {
      const googleRes = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (!googleRes.ok) {
        return res.status(401).json({
          success: false,
          message: "Invalid Google token",
        });
      }

      const googleData = await googleRes.json();
      socialUser = {
        email: googleData.email,
        name: googleData.name,
        avatar: googleData.picture || null,
      };
    } else if (provider === "facebook") {
      const fbUrl = new URL("https://graph.facebook.com/me");
      fbUrl.searchParams.set("fields", "id,name,email,picture");
      fbUrl.searchParams.set("access_token", accessToken);

      const fbRes = await fetch(fbUrl.toString());
      const fbData = await fbRes.json();

      if (!fbRes.ok || fbData.error) {
        return res.status(401).json({
          success: false,
          message: "Invalid Facebook token",
        });
      }

      socialUser = {
        email: fbData.email || null,
        name: fbData.name,
        avatar: fbData.picture?.data?.url || null,
      };
    }

    if (!socialUser?.email) {
      return res.status(400).json({
        success: false,
        message:
          "Email not available from social provider. Please grant email permission.",
      });
    }

    const normalizedEmail = socialUser.email.trim().toLowerCase();

    const [users] = await pool.execute(
      "SELECT id, name, email, avatar_url, avatar_file_id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );

    let userId;
    let userRecord;

    if (users.length > 0) {
      userId = users[0].id;
      userRecord = users[0];

      // Keep existing custom avatar, but auto-fill it from social provider when missing.
      const hasStoredAvatar = Boolean(userRecord.avatar_url);
      if (!hasStoredAvatar && socialUser.avatar) {
        await pool.execute("UPDATE users SET avatar_url = ? WHERE id = ?", [
          socialUser.avatar,
          userId,
        ]);
        userRecord.avatar_url = socialUser.avatar;
      }
    } else {
      // New social user — create account without OTP (already verified by provider)
      const randomPassword = await bcrypt.hash(
        crypto.randomBytes(32).toString("hex"),
        10,
      );

      const [insertResult] = await pool.execute(
        "INSERT INTO users (name, email, password, is_verified, avatar_url) VALUES (?, ?, ?, 1, ?)",
        [
          socialUser.name || normalizedEmail,
          normalizedEmail,
          randomPassword,
          socialUser.avatar || null,
        ],
      );

      userId = insertResult.insertId;
      userRecord = {
        id: userId,
        name: socialUser.name || normalizedEmail,
        email: normalizedEmail,
        avatar_url: socialUser.avatar || null,
        avatar_file_id: null,
      };
    }

    const accessTok = signAccessToken(userId);
    const refreshTok = signRefreshToken(userId);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken: accessTok,
      refreshToken: refreshTok,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        avatar: userRecord.avatar_url
          ? { url: userRecord.avatar_url, file_id: userRecord.avatar_file_id }
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Social login failed",
      error: error.message,
    });
  }
};

module.exports = {
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
};
