const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5,                   
    message: { msg: "Too many attempts. Try again after 15 minutes." }
});

const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 5,                    
    message: { msg: "Too many OTP attempts. Please request a new one." }
});

module.exports = {loginLimiter, otpLimiter};