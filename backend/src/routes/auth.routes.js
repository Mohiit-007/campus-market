const express = require("express");
const verifyAccessToken = require("../middleware/auth.middleware");
const {
    registeruser, refreshToken, logoutuser,
    logoutAlluser, loginUser, getuser,
    resendOtp, verifyemail, googleAuthCallback             
} = require("../controllers/auth.controllers")
const passport = require("../config/passport.config");

const {loginLimiter, otpLimiter} = require("../middleware/rate.limits");
const route = express.Router();

route.post('/register',registeruser);
route.post('/login',loginLimiter,loginUser);
route.post('/logout',logoutuser);
route.post('/logoutall',logoutAlluser);
route.post('/verify-email',otpLimiter,verifyemail);
route.post('/resend-otp',otpLimiter,resendOtp);
route.get('/refresh-token',refreshToken);
route.get('/get-me',verifyAccessToken,getuser);

route.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
    })
);

route.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
        session: false,
    }),
    googleAuthCallback
);

module.exports = route;