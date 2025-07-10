import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export const register = async (req, res) => {
  const { name, Phone, email, password, role } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

    const newUser = await prisma.user.create({
      data: {
        name,
        Phone,
        email,
        password: hashedPassword,
        role,
        emailToken: verificationCode,
        emailTokenExpires: tokenExpiry,
        isVerified: false,
      },
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Court Booking" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Email Verification Code",
      html: `
        <p>Hello ${name},</p>
        <p>Thank you for registering. Your verification code is:</p>
        <h2>${verificationCode}</h2>
        <p>This code will expire in 2 minutes.</p>
      `,
    });

    res.status(201).json({ message: "User registered. Please check your email to verify." });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: "User registration failed. Please try again later." });
  }
};


export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if email exists
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) return res.status(401).json({ message: "Invalid email" });

        if (!user.isVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in." });
          }

        // Check if password is correct
        const checkPassword = await bcrypt.compare(password, user.password);

        if (!checkPassword) return res.status(401).json({ message: "Invalid password" });

        // Generate JWT token
        const age = 1000 * 60 * 60 * 24 * 7;
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: age }
        );

        const { password: userPassword, ...userInfo } = user;

        // Ensure role is part of userInfo before sending response
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: age,
        }).status(200).json({
            user: { ...userInfo },  // Wrap user info inside 'user' key
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to login" });
    }
};


export const logout = (req, res) => {
    res.clearCookie("token").status(200).json({message:"Logout success."})
};


export const verifyEmail = async (req, res) => {
  const { code } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        emailToken: code,
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    if (user.emailTokenExpires && user.emailTokenExpires < new Date()) {
      return res.status(400).json({ message: "Verification code expired." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailToken: null,
        emailTokenExpires: null,
      },
    });

    res.json({ message: "Email verified successfully!" });
  } catch (err) {
    console.error("Verification Error:", err);
    res.status(500).json({ message: "Something went wrong during verification." });
  }
};

import crypto from "crypto";

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry: tokenExpiry,
      },
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Court Booking" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          
          <div style="margin: 25px 0;">
            <a href="${resetLink}" 
               style="background-color: #4CAF50; 
                      color: white; 
                      padding: 12px 24px; 
                      text-decoration: none; 
                      border-radius: 4px;
                      font-weight: bold;
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>This link will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666; font-size: 12px;">${resetLink}</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">Court Booking System</p>
        </div>
      `,
    });

    res.json({ message: "Password reset link sent to email." });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Failed to send reset email." });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: "Password reset successful." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Failed to reset password." });
  }
};