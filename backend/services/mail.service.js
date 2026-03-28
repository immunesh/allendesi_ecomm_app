const nodemailer = require("nodemailer");

const getPresetConfig = () => {
  const provider = (process.env.SMTP_PROVIDER || "custom").toLowerCase();

  if (provider === "gmail") {
    return {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      provider,
    };
  }

  if (provider === "mailtrap") {
    return {
      host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
      port: Number(process.env.SMTP_PORT || 2525),
      secure: false,
      provider,
    };
  }

  return {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    provider: "custom",
  };
};

const hasSmtpConfig = () => {
  const preset = getPresetConfig();
  return Boolean(
    preset.host &&
      preset.port &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
};

const getTransporter = () => {
  if (!hasSmtpConfig()) {
    return null;
  }

  const preset = getPresetConfig();

  return nodemailer.createTransport({
    host: preset.host,
    port: Number(preset.port),
    secure: preset.secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const verifySmtpConnection = async () => {
  const transporter = getTransporter();

  if (!transporter) {
    return {
      success: false,
      message: "SMTP is not configured",
    };
  }

  try {
    await transporter.verify();
    const preset = getPresetConfig();
    return {
      success: true,
      message: "SMTP connection verified successfully",
      provider: preset.provider,
      host: preset.host,
      port: preset.port,
    };
  } catch (error) {
    return {
      success: false,
      message: "SMTP verification failed",
      error: error.message,
    };
  }
};

const sendResetPasswordEmail = async ({ to, resetLink }) => {
  const transporter = getTransporter();

  if (!transporter) {
    throw new Error("SMTP is not configured");
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: "Reset your eShop password",
    text: `We received a request to reset your password. Use this link to continue: ${resetLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <h2 style="margin-bottom: 8px;">Reset your password</h2>
        <p style="margin-top: 0;">We received a request to reset your eShop account password.</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; background: #2563EB; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 6px;">Reset Password</a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link expires in 15 minutes.</p>
      </div>
    `,
  });
};

const sendOtpVerificationEmail = async ({ to, name, otp }) => {
  const transporter = getTransporter();

  if (!transporter) {
    throw new Error("SMTP is not configured");
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const greetingName = name || "there";

  await transporter.sendMail({
    from,
    to,
    subject: "Your eShop verification code",
    text: `Hi ${greetingName}, your eShop verification code is ${otp}. This code expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <h2 style="margin-bottom: 8px;">Verify your account</h2>
        <p style="margin-top: 0;">Hi ${greetingName}, use the code below to complete your signup.</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 8px; background: #EFF6FF; color: #1D4ED8; display: inline-block; padding: 14px 18px; border-radius: 8px; margin: 12px 0;">
          ${otp}
        </div>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
};

module.exports = {
  hasSmtpConfig,
  verifySmtpConnection,
  sendOtpVerificationEmail,
  sendResetPasswordEmail,
};
