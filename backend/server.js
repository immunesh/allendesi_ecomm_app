require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const { verifySmtpConnection } = require("./services/mail.service");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/auth/api/verify-smtp", async (req, res) => {
  try {
    const result = await verifySmtpConnection();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "SMTP verification failed",
      error: error.message,
    });
  }
});

app.get("/api/verify-smtp", async (req, res) => {
  try {
    const result = await verifySmtpConnection();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "SMTP verification failed",
      error: error.message,
    });
  }
});

app.use("/auth", authRoutes);
app.use("/product", productRoutes);
app.use("/recommendation", recommendationRoutes);

app.get("/", (req, res) => {
  res.send("SQL Backend Running");
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      message: error.message,
    });
  }
});

const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL connected successfully");
    connection.release();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect MySQL:", error.message);
    process.exit(1);
  }
};

startServer();