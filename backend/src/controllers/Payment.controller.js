const Razorpay = require("razorpay");
const crypto = require("crypto");
const paymentmodel = require("../model/payment.model");
const productmodel = require("../model/product.model");
const usermodel = require("../model/user.model");
const sendEmail = require("../services/email.services");
const {
    getSellerNotificationHtml,
    getBuyerPaymentReceivedHtml,
    getBuyerConfirmedHtml,
} = require("../utils/utils.payment.emails");

// ─────────────────────────────────────────────────────────────
// Razorpay client (singleton)
// Needs RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env
// ─────────────────────────────────────────────────────────────
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────────────────────
// STEP 1 — CREATE ORDER
// POST /api/payments/create-order
// Called when buyer clicks "Buy Now"
// Returns a Razorpay order_id which the frontend uses to open checkout
// ─────────────────────────────────────────────────────────────
async function createOrder(req, res) {
    try {
        const { productId } = req.body;
        const buyerId = req.user.id;

        // Validate product exists and is available
        const product = await productmodel.findById(productId).populate("seller", "name email");
        if (!product) {
            return res.status(404).json({ msg: "Product not found" });
        }
        if (product.status !== "available") {
            return res.status(400).json({ msg: "Product is no longer available" });
        }

        // Prevent seller from buying their own product
        if (product.seller._id.toString() === buyerId.toString()) {
            return res.status(400).json({ msg: "You cannot buy your own product" });
        }

        // Razorpay amount is in paise (₹1 = 100 paise)
        const amountInPaise = Math.round(product.price * 100);

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_${productId}_${Date.now()}`,
            notes: {
                productId: productId.toString(),
                buyerId: buyerId.toString(),
                sellerId: product.seller._id.toString(),
            },
        });

        // Save payment record with status "created"
        const payment = await paymentmodel.create({
            razorpayOrderId: razorpayOrder.id,
            product: productId,
            buyer: buyerId,
            seller: product.seller._id,
            amount: amountInPaise,
        });

        res.status(201).json({
            msg: "Order created successfully",
            // Send these to frontend — needed to open Razorpay checkout
            orderId: razorpayOrder.id,
            amount: amountInPaise,
            currency: "INR",
            keyId: process.env.RAZORPAY_KEY_ID,
            // For prefilling checkout form
            productTitle: product.title,
        });

    } catch (error) {
        res.status(500).json({ msg: "Internal server error", error: error.message });
    }
}

// ─────────────────────────────────────────────────────────────
// STEP 2 — VERIFY PAYMENT
// POST /api/payments/verify
// Called by frontend AFTER Razorpay checkout succeeds
// Verifies HMAC signature to confirm payment is genuine
// Then notifies seller to confirm
// ─────────────────────────────────────────────────────────────
async function verifyPayment(req, res) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const buyerId = req.user.id;

        // ── Signature verification ──────────────────────────────
        // Razorpay signs the response with: HMAC(order_id + "|" + payment_id, key_secret)
        // We compute the same and compare — if they match, payment is genuine
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            // Signature mismatch — mark payment as failed
            await paymentmodel.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { status: "failed" }
            );
            return res.status(400).json({ msg: "Payment verification failed. Invalid signature." });
        }

        // ── Update payment record ──────────────────────────────
        const payment = await paymentmodel
            .findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id, buyer: buyerId },
                {
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    status: "paid",
                    paidAt: new Date(),
                },
                { new: true }
            )
            .populate("product", "title price")
            .populate("buyer", "name email")
            .populate("seller", "name email");

        if (!payment) {
            return res.status(404).json({ msg: "Payment record not found" });
        }

        // ── Build seller confirm URL ────────────────────────────
        // This deep link opens the seller's dashboard at the right order
        // Adjust CLIENT_URL path to match your frontend route
        const confirmUrl = `${process.env.CLIENT_URL}/seller/confirm-order/${payment._id}`;

        // ── Email seller: "You have a new order, please confirm" ─
        await sendEmail(
            payment.seller.email,
            "🎉 New Order — Please Confirm",
            `${payment.buyer.name} has paid for "${payment.product.title}". Please confirm the order.`,
            getSellerNotificationHtml({
                sellerName: payment.seller.name,
                buyerName: payment.buyer.name,
                productTitle: payment.product.title,
                amount: payment.amount,
                paymentId: razorpay_payment_id,
                confirmUrl,
            })
        );

        // ── Email buyer: "Payment received, waiting for seller" ─
        await sendEmail(
            payment.buyer.email,
            "Payment Received — Waiting for Seller Confirmation",
            `Your payment for "${payment.product.title}" was received. The seller will confirm shortly.`,
            getBuyerPaymentReceivedHtml({
                buyerName: payment.buyer.name,
                productTitle: payment.product.title,
                amount: payment.amount,
                paymentId: razorpay_payment_id,
            })
        );

        res.status(200).json({
            msg: "Payment verified. Seller has been notified.",
            paymentId: payment._id,
            status: payment.status,
        });

    } catch (error) {
        res.status(500).json({ msg: "Internal server error", error: error.message });
    }
}

// ─────────────────────────────────────────────────────────────
// STEP 3 — SELLER CONFIRMS ORDER
// POST /api/payments/confirm/:paymentId
// Only the seller of that product can call this
// Marks product as "sold" and notifies buyer
// ─────────────────────────────────────────────────────────────
async function confirmOrder(req, res) {
    try {
        const { paymentId } = req.params;
        const sellerId = req.user.id;

        const payment = await paymentmodel
            .findById(paymentId)
            .populate("product", "title price")
            .populate("buyer", "name email")
            .populate("seller", "name email");

        if (!payment) {
            return res.status(404).json({ msg: "Payment not found" });
        }

        // Only the seller of this product can confirm
        if (payment.seller._id.toString() !== sellerId.toString()) {
            return res.status(403).json({ msg: "Unauthorized. Only the seller can confirm this order." });
        }

        // Can only confirm payments in "paid" state
        if (payment.status !== "paid") {
            return res.status(400).json({
                msg: `Cannot confirm. Current status: ${payment.status}`,
            });
        }

        // ── Mark payment confirmed ──────────────────────────────
        payment.status = "confirmed";
        payment.confirmedAt = new Date();
        await payment.save();

        // ── Mark product as sold ────────────────────────────────
        await productmodel.findByIdAndUpdate(payment.product._id, { status: "sold" });

        // ── Email buyer: "Seller confirmed, sale complete" ──────
        await sendEmail(
            payment.buyer.email,
            "🎉 Order Confirmed — Sale Complete!",
            `${payment.seller.name} confirmed your order for "${payment.product.title}".`,
            getBuyerConfirmedHtml({
                buyerName: payment.buyer.name,
                productTitle: payment.product.title,
                sellerName: payment.seller.name,
                amount: payment.amount,
            })
        );

        res.status(200).json({
            msg: "Order confirmed. Product marked as sold.",
            payment,
        });

    } catch (error) {
        res.status(500).json({ msg: "Internal server error", error: error.message });
    }
}

// ─────────────────────────────────────────────────────────────
// WEBHOOK — RAZORPAY SERVER-TO-SERVER EVENTS
// POST /api/payments/webhook
// Razorpay sends this for server-side confirmation (edge cases)
// e.g. payment captured after network failure on frontend
// ─────────────────────────────────────────────────────────────
async function webhook(req, res) {
    try {
        // Razorpay signs webhooks with a secret set in your Razorpay dashboard
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers["x-razorpay-signature"];

        // Verify webhook authenticity
        const expectedSig = crypto
            .createHmac("sha256", webhookSecret)
            .update(JSON.stringify(req.body))
            .digest("hex");

        if (expectedSig !== signature) {
            return res.status(400).json({ msg: "Invalid webhook signature" });
        }

        const { event, payload } = req.body;

        // Only handle the payment.captured event
        // This fires when Razorpay successfully captures a payment
        if (event === "payment.captured") {
            const razorpayOrderId = payload.payment.entity.order_id;
            const razorpayPaymentId = payload.payment.entity.id;

            // Avoid double-processing if frontend verify already ran
            const existing = await paymentmodel.findOne({ razorpayOrderId });
            if (existing && existing.status === "created") {
                await paymentmodel.findOneAndUpdate(
                    { razorpayOrderId },
                    {
                        razorpayPaymentId,
                        status: "paid",
                        paidAt: new Date(),
                    }
                );
                // Note: seller email not sent here to avoid duplicate.
                // The /verify route handles emails. Webhook is a safety net only.
            }
        }

        // Always respond 200 to Razorpay quickly
        res.status(200).json({ received: true });

    } catch (error) {
        res.status(500).json({ msg: "Webhook error", error: error.message });
    }
}

// ─────────────────────────────────────────────────────────────
// GET PAYMENT STATUS
// GET /api/payments/:paymentId
// Buyer or seller can check status of a payment
// ─────────────────────────────────────────────────────────────
async function getPaymentStatus(req, res) {
    try {
        const { paymentId } = req.params;
        const userId = req.user.id;

        const payment = await paymentmodel
            .findById(paymentId)
            .populate("product", "title images price status")
            .populate("buyer", "name email")
            .populate("seller", "name email");

        if (!payment) {
            return res.status(404).json({ msg: "Payment not found" });
        }

        // Only buyer or seller can see this payment
        const isBuyer = payment.buyer._id.toString() === userId.toString();
        const isSeller = payment.seller._id.toString() === userId.toString();
        if (!isBuyer && !isSeller) {
            return res.status(403).json({ msg: "Unauthorized" });
        }

        res.status(200).json({ msg: "Payment fetched", payment });

    } catch (error) {
        res.status(500).json({ msg: "Internal server error", error: error.message });
    }
}

// ─────────────────────────────────────────────────────────────
// GET MY PAYMENTS
// GET /api/payments/my
// Returns all payments where logged-in user is buyer or seller
// ─────────────────────────────────────────────────────────────
async function getMyPayments(req, res) {
    try {
        const userId = req.user.id;

        const payments = await paymentmodel
            .find({
                $or: [{ buyer: userId }, { seller: userId }],
            })
            .populate("product", "title images price status")
            .populate("buyer", "name email avatar")
            .populate("seller", "name email avatar")
            .sort({ createdAt: -1 });

        res.status(200).json({
            msg: "Payments fetched",
            count: payments.length,
            payments,
        });

    } catch (error) {
        res.status(500).json({ msg: "Internal server error", error: error.message });
    }
}

module.exports = {
    createOrder,
    verifyPayment,
    confirmOrder,
    webhook,
    getPaymentStatus,
    getMyPayments,
};