const express = require("express");
const morgan = require("morgan");
const cookieparser = require("cookie-parser");
const passport = require("./config/passport.config");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const conversationRoutes = require("./routes/conversation.routes");
const paymentRoutes = require("./routes/Payment.routes");

const app = express();

// ─────────────────────────────────────────────────────────────
// WEBHOOK ROUTE — must come BEFORE express.json()
// Razorpay sends a raw body; express.json() would consume it
// before we can verify the HMAC signature.
// We give this route its own raw-body parser instead.
// ─────────────────────────────────────────────────────────────
app.use(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    (req, _res, next) => {
        // Convert raw Buffer → parsed object so the controller
        // can read req.body normally (after signature check)
        if (Buffer.isBuffer(req.body)) {
            req.rawBody = req.body;          // keep raw copy for HMAC
            req.body = JSON.parse(req.body); // parsed copy for logic
        }
        next();
    }
);

// ─────────────────────────────────────────────────────────────
// Standard middleware (after webhook raw handler)
// ─────────────────────────────────────────────────────────────
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieparser());
app.use(passport.initialize());

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────
app.use("/user", authRoutes);
app.use("/api", productRoutes);
app.use("/api", conversationRoutes);
app.use("/api", paymentRoutes);

module.exports = app;