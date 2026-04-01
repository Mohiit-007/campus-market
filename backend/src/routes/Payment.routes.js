const express = require("express");
const verifyAccessToken = require("../middleware/auth.middleware");
const {
    createOrder,
    verifyPayment,
    confirmOrder,
    webhook,
    getPaymentStatus,
    getMyPayments,
} = require("../controllers/Payment.controller");

const route = express.Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC — Razorpay posts webhooks here (no JWT needed)
// IMPORTANT: Register this BEFORE express.json() parses the body
// so raw body is available for signature verification.
// We handle this in app.js (see note there).
// ─────────────────────────────────────────────────────────────
route.post("/payments/webhook", webhook);

// ─────────────────────────────────────────────────────────────
// PROTECTED — all routes below require login
// ─────────────────────────────────────────────────────────────

// Buyer: create Razorpay order before opening checkout
route.post("/payments/create-order", verifyAccessToken, createOrder);

// Buyer: called by frontend after Razorpay checkout succeeds
route.post("/payments/verify", verifyAccessToken, verifyPayment);

// Seller: confirm the order after being notified
route.post("/payments/confirm/:paymentId", verifyAccessToken, confirmOrder);

// Buyer or Seller: check status of a specific payment
route.get("/payments/:paymentId", verifyAccessToken, getPaymentStatus);

// Buyer or Seller: list all their payments
route.get("/payments/my/all", verifyAccessToken, getMyPayments);

module.exports = route;