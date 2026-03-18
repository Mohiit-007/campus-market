function generateOtp() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

function getOtpHtml(otp) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Verify your email</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f4f5" style="background:#f4f4f5;">
        <tr>
            <td align="center" style="padding:48px 16px;">

                <table width="420" cellpadding="0" cellspacing="0"
                    style="background:#ffffff;border-radius:8px;width:100%;max-width:420px;border:1px solid #e4e4e7;">

                    <!-- Header -->
                    <tr>
                        <td style="padding:32px 40px 24px;border-bottom:1px solid #f0f0f0;">
                            <span style="font-size:18px;font-weight:700;color:#18181b;letter-spacing:-0.3px;font-family:'Segoe UI',Arial,sans-serif;">
                                JCTSL
                            </span>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:32px 40px;">
                            <p style="margin:0 0 6px 0;font-size:13px;font-weight:500;color:#71717a;text-transform:uppercase;letter-spacing:0.8px;font-family:'Segoe UI',Arial,sans-serif;">
                                Verification code
                            </p>
                            <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:600;color:#18181b;font-family:'Segoe UI',Arial,sans-serif;">
                                Verify your email address
                            </h2>
                            <p style="margin:0 0 28px 0;font-size:14px;color:#71717a;line-height:1.6;font-family:'Segoe UI',Arial,sans-serif;">
                                Use the code below to verify your email. This code is valid for
                                <span style="color:#18181b;font-weight:500;">10 minutes</span>
                                and can only be used once.
                            </p>

                            <!-- OTP Box — click to select all -->
                            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
                                <tr>
                                    <td align="center"
                                        style="background:#fafafa;border:1px solid #e4e4e7;border-radius:6px;padding:20px;">
                                        <p style="margin:0 0 4px 0;font-size:12px;color:#a1a1aa;font-family:'Segoe UI',Arial,sans-serif;">
                                            Your one-time password
                                        </p>
                                        <p style="
                                            margin:0;
                                            font-size:36px;
                                            font-weight:700;
                                            color:#18181b;
                                            letter-spacing:12px;
                                            font-family:'Courier New',monospace;
                                            user-select:all;
                                            -webkit-user-select:all;
                                            cursor:text;
                                        ">${otp}</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;font-family:'Segoe UI',Arial,sans-serif;">
                                If you didn't request this, you can ignore this email. Your account remains secure.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
                            <p style="margin:0;font-size:12px;color:#a1a1aa;font-family:'Segoe UI',Arial,sans-serif;">
                                &copy; ${new Date().getFullYear()} YourApp &nbsp;&middot;&nbsp; Do not reply to this email
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
    </body>
    </html>
    `;
}

module.exports = {generateOtp , getOtpHtml};