// ─────────────────────────────────────────────────────────────
// Email sent to SELLER after buyer pays
// Asks seller to confirm or reject the order
// ─────────────────────────────────────────────────────────────
function getSellerNotificationHtml({ sellerName, buyerName, productTitle, amount, paymentId, confirmUrl }) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"/><title>New Order</title></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f4f5">
        <tr><td align="center" style="padding:48px 16px;">
            <table width="460" cellpadding="0" cellspacing="0"
                style="background:#fff;border-radius:8px;max-width:460px;border:1px solid #e4e4e7;">

                <tr><td style="padding:28px 36px 20px;border-bottom:1px solid #f0f0f0;">
                    <span style="font-size:18px;font-weight:700;color:#18181b;">JCTSL Marketplace</span>
                </td></tr>

                <tr><td style="padding:28px 36px;">
                    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b;">🎉 You have a new order!</h2>
                    <p style="margin:0 0 20px;font-size:14px;color:#71717a;line-height:1.6;">
                        Hi <strong>${sellerName}</strong>, <strong>${buyerName}</strong> has paid for your listing.
                        Please confirm to complete the sale.
                    </p>

                    <!-- Order summary box -->
                    <table cellpadding="0" cellspacing="0"
                        style="width:100%;background:#fafafa;border:1px solid #e4e4e7;border-radius:6px;margin-bottom:24px;">
                        <tr><td style="padding:16px 20px;">
                            <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:.8px;">Order Details</p>
                            <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#18181b;">${productTitle}</p>
                            <p style="margin:0 0 6px;font-size:14px;color:#52525b;">
                                Amount paid: <strong style="color:#16a34a;">₹${(amount / 100).toLocaleString("en-IN")}</strong>
                            </p>
                            <p style="margin:0;font-size:12px;color:#a1a1aa;">Payment ID: ${paymentId}</p>
                        </td></tr>
                    </table>

                    <!-- CTA button -->
                    <table cellpadding="0" cellspacing="0" style="width:100%;">
                        <tr>
                            <td style="padding-right:8px;width:50%;">
                                <a href="${confirmUrl}"
                                    style="display:block;text-align:center;background:#18181b;color:#fff;
                                           padding:12px 0;border-radius:6px;font-size:14px;font-weight:600;
                                           text-decoration:none;">
                                    ✅ Confirm Order
                                </a>
                            </td>
                        </tr>
                    </table>

                    <p style="margin:20px 0 0;font-size:12px;color:#a1a1aa;line-height:1.6;">
                        If you don't confirm within 48 hours, the order may be automatically cancelled and the buyer refunded.
                    </p>
                </td></tr>

                <tr><td style="padding:16px 36px;border-top:1px solid #f0f0f0;">
                    <p style="margin:0;font-size:12px;color:#a1a1aa;">
                        &copy; ${new Date().getFullYear()} JCTSL &nbsp;&middot;&nbsp; Do not reply to this email
                    </p>
                </td></tr>

            </table>
        </td></tr>
    </table>
    </body>
    </html>`;
}

// ─────────────────────────────────────────────────────────────
// Email sent to BUYER after their payment is received
// Tells them to wait for seller confirmation
// ─────────────────────────────────────────────────────────────
function getBuyerPaymentReceivedHtml({ buyerName, productTitle, amount, paymentId }) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"/><title>Payment Received</title></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f4f5">
        <tr><td align="center" style="padding:48px 16px;">
            <table width="460" cellpadding="0" cellspacing="0"
                style="background:#fff;border-radius:8px;max-width:460px;border:1px solid #e4e4e7;">

                <tr><td style="padding:28px 36px 20px;border-bottom:1px solid #f0f0f0;">
                    <span style="font-size:18px;font-weight:700;color:#18181b;">JCTSL Marketplace</span>
                </td></tr>

                <tr><td style="padding:28px 36px;">
                    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b;">Payment Received ✓</h2>
                    <p style="margin:0 0 20px;font-size:14px;color:#71717a;line-height:1.6;">
                        Hi <strong>${buyerName}</strong>, we've received your payment. 
                        The seller has been notified and will confirm shortly.
                    </p>

                    <table cellpadding="0" cellspacing="0"
                        style="width:100%;background:#fafafa;border:1px solid #e4e4e7;border-radius:6px;margin-bottom:20px;">
                        <tr><td style="padding:16px 20px;">
                            <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:.8px;">Order Summary</p>
                            <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#18181b;">${productTitle}</p>
                            <p style="margin:0 0 6px;font-size:14px;color:#52525b;">
                                Amount: <strong style="color:#16a34a;">₹${(amount / 100).toLocaleString("en-IN")}</strong>
                            </p>
                            <p style="margin:0;font-size:12px;color:#a1a1aa;">Payment ID: ${paymentId}</p>
                        </td></tr>
                    </table>

                    <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">
                        You'll receive another email once the seller confirms. Keep this email as your payment receipt.
                    </p>
                </td></tr>

                <tr><td style="padding:16px 36px;border-top:1px solid #f0f0f0;">
                    <p style="margin:0;font-size:12px;color:#a1a1aa;">
                        &copy; ${new Date().getFullYear()} JCTSL &nbsp;&middot;&nbsp; Do not reply to this email
                    </p>
                </td></tr>
            </table>
        </td></tr>
    </table>
    </body>
    </html>`;
}

// ─────────────────────────────────────────────────────────────
// Email sent to BUYER once seller confirms
// ─────────────────────────────────────────────────────────────
function getBuyerConfirmedHtml({ buyerName, productTitle, sellerName, amount }) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"/><title>Order Confirmed</title></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f4f5">
        <tr><td align="center" style="padding:48px 16px;">
            <table width="460" cellpadding="0" cellspacing="0"
                style="background:#fff;border-radius:8px;max-width:460px;border:1px solid #e4e4e7;">

                <tr><td style="padding:28px 36px 20px;border-bottom:1px solid #f0f0f0;">
                    <span style="font-size:18px;font-weight:700;color:#18181b;">JCTSL Marketplace</span>
                </td></tr>

                <tr><td style="padding:28px 36px;">
                    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b;">🎉 Order Confirmed!</h2>
                    <p style="margin:0 0 20px;font-size:14px;color:#71717a;line-height:1.6;">
                        Hi <strong>${buyerName}</strong>, great news! <strong>${sellerName}</strong> has confirmed your order.
                        Please coordinate with the seller to arrange pickup/delivery.
                    </p>

                    <table cellpadding="0" cellspacing="0"
                        style="width:100%;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;margin-bottom:20px;">
                        <tr><td style="padding:16px 20px;">
                            <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#18181b;">${productTitle}</p>
                            <p style="margin:0;font-size:14px;color:#16a34a;font-weight:600;">
                                ₹${(amount / 100).toLocaleString("en-IN")} — Sale Complete
                            </p>
                        </td></tr>
                    </table>

                    <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">
                        Thank you for using JCTSL Marketplace. Enjoy your purchase!
                    </p>
                </td></tr>

                <tr><td style="padding:16px 36px;border-top:1px solid #f0f0f0;">
                    <p style="margin:0;font-size:12px;color:#a1a1aa;">
                        &copy; ${new Date().getFullYear()} JCTSL &nbsp;&middot;&nbsp; Do not reply to this email
                    </p>
                </td></tr>
            </table>
        </td></tr>
    </table>
    </body>
    </html>`;
}

module.exports = {
    getSellerNotificationHtml,
    getBuyerPaymentReceivedHtml,
    getBuyerConfirmedHtml,
};