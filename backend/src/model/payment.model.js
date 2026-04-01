const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        // Razorpay IDs
        razorpayOrderId: {
            type: String,
            required: true,
            unique: true,
        },
        razorpayPaymentId: {
            type: String,
            default: null, // filled after buyer pays
        },
        razorpaySignature: {
            type: String,
            default: null, // filled after verification
        },

        // References
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
            required: true,
        },
        buyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },

        // Amount in paise (Razorpay uses smallest currency unit)
        // e.g. ₹500 = 50000 paise
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
        },

        // Payment lifecycle:
        //   created              → Razorpay order created, buyer hasn't paid yet
        //   paid                 → Buyer paid, waiting for seller to confirm
        //   confirmed            → Seller confirmed, product marked sold
        //   failed               → Payment failed or signature mismatch
        //   refund_requested     → (future scope)
        status: {
            type: String,
            enum: ["created", "paid", "confirmed", "failed"],
            default: "created",
        },

        // Timestamps for each stage
        paidAt: { type: Date, default: null },
        confirmedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

const Payment = mongoose.model("payment", paymentSchema);
module.exports = Payment;