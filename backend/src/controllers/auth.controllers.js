const usermodel = require("../model/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sessionmodel = require("../model/session.model");
const sendEmail = require("../services/email.services");
const {generateOtp , getOtpHtml} = require("../utils/utils.otp");
const otpmodel = require("../model/otp.model");

async function registeruser(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ msg: "All fields are required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ msg: "Invalid email format" });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                msg: "Password must be 8+ chars with uppercase, lowercase, number and special character"
            });
        }        

        const useremail = await usermodel.findOne({ email });
        if (useremail) {
            return res.status(400).json({ msg: "User already exists" });
        }

        const hashedpassword = await bcrypt.hash(password, 10);
        const user = await usermodel.create({
            name,
            email,
            password: hashedpassword,
        });

        const otp = generateOtp();
        const html = getOtpHtml(otp);
        const otpHash = await bcrypt.hash(otp,10);

        await otpmodel.create({
            email,
            user : user._id,
            otpHash : otpHash,
        })

        await sendEmail(email,"OTP verification",`Your OTP code is ${otp}`, html)

        res.status(201).json({
            msg: "User created successfully. Please check your email for OTP.",
            user: { name, email, verified: user.verified },
        });

    } catch (error) {
        res.status(500).json({
            msg: "Internal server error",
            error: error.message,
        });
    }
}

async function logoutuser(req,res) {
    const refreshtoken = req.cookies?.refreshtoken;

    if(!refreshtoken){
        return res.status(400).send({msg : "Refresh token not found"});
    }
    try {
        const decoded = jwt.verify(refreshtoken, process.env.REFRESH_TOKEN_SECRET);

        const session = await sessionmodel.findOne({
            _id : decoded.sessionId,
            revoke : false,
        });

        if (!session) {
            return res.status(400).json({ msg: "Session not found" });
        }

        const isValid = await bcrypt.compare(refreshtoken, session.refreshtoken);
        if (!isValid) {
            return res.status(400).json({ msg: "Invalid refresh token" });
        }

        session.revoke = true;
        session.revokedAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await session.save();

        res.clearCookie("refreshtoken")

        res.status(200).json({
            msg : "user logout successfully"
        })

    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ msg: "Invalid or expired refresh token" });
        }
        res.status(500).json({
            msg : "Internal server error",
            error : error.message
        })
    }
}

async function refreshToken(req,res){
    const refreshtoken = req.cookies?.refreshtoken;

    if(!refreshtoken){
        return res.status(401).json({
            msg : "refresh token not found",
        })
    }

    try {
        const decoded = jwt.verify(refreshtoken, process.env.REFRESH_TOKEN_SECRET);

        const session = await sessionmodel.findOne({
            _id : decoded.sessionId,
            revoke : false,
        })

        if(!session){
            return res.status(401).json({msg : "session not found"})
        }

        const isValid = await bcrypt.compare(refreshtoken,session.refreshtoken);
        if (!isValid) {
            return res.status(400).json({ msg: "Invalid refresh token" });
        }

        const accesstoken = jwt.sign({
            id : decoded.id,
        },process.env.ACCESS_TOKEN_SECRET,{
            expiresIn : "15m"
        })

        const newRefreshToken = jwt.sign({
            id : decoded.id,
            sessionId: decoded.sessionId,
        },process.env.REFRESH_TOKEN_SECRET,{
            expiresIn : "7d"
        })

        const newhashedrefreshtoken = await bcrypt.hash(newRefreshToken, 10);

        session.refreshtoken = newhashedrefreshtoken;
        await session.save();

        res.cookie("refreshtoken", newRefreshToken, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            msg : "accesstoken generated successfully",
            accesstoken,
        })
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ msg: "Invalid or expired refresh token" });
        }
        res.status(500).json({
            msg : "Internal server error",
            error : error.message
        })
    }
}

async function logoutAlluser(req,res){
    const refreshtoken = req.cookies?.refreshtoken;

    if(!refreshtoken){
        return res.status(400).json({msg : "Refresh token not found"});
    }

    try{
        const decoded = jwt.verify(refreshtoken,process.env.REFRESH_TOKEN_SECRET);

        await sessionmodel.updateMany({
            userId: decoded.id,
            revoke: false,
        }, {
            revoke: true,
            revokedAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        });

        res.clearCookie("refreshtoken");

        res.status(200).json({msg : "logout from all devices"});
    }
    catch(error){
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ msg: "Invalid or expired refresh token" });
        }
        res.status(500).json({
            msg : "Internal server error",
            error : error.message
        })
    }
}

async function loginUser(req,res){
    try {
        const {email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({msg : "All fields are requierd"});
        }

        const user = await usermodel.findOne({email});
        if(!user){
            return res.status(401).json({msg : "User not found"});
        }

        if (user.authProvider === "google") {
            return res.status(400).json({
                msg: "This account uses Google login. Please sign in with Google."
            });
        }

        if(!user.verified){
            return res.status(403).json({msg: "Email not verified. Please verify your email."});
        }

        const isValid = await bcrypt.compare(password,user.password);
        if (!isValid) {
            return res.status(401).json({ msg: "Invalid credentials" });
        }
        
        const session = await sessionmodel.create({
            userId: user._id,
            refreshtoken: "pending",
            ip: req.ip,
            userAgent: req.headers["user-agent"], 
        });
        
        const refreshtoken = jwt.sign(
            { id: user._id, sessionId: session._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        const hashedrefreshtoken = await bcrypt.hash(refreshtoken, 10);
        session.refreshtoken = hashedrefreshtoken;
        await session.save();

        const accesstoken = jwt.sign(
            { id: user._id, sessionId: session._id },
            process.env.ACCESS_TOKEN_SECRET,   
            { expiresIn: "15m" }
        );

        res.cookie("refreshtoken", refreshtoken, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            msg: "User loggedIn successfully",
            user: { name: user.name, email },
            accesstoken,
        });

    } catch (error) {
        res.status(500).json({
            msg : "Internal server error",
            error : error.message
        })
    }
}

async function getuser(req, res) {
    try {
        const user = await usermodel.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        res.status(200).json({
            msg: "User fetched successfully",
            user,
        });

    } catch (error) {
        res.status(500).json({
            msg: "Internal server error",
            error: error.message,
        });
    }
}

async function verifyemail(req,res){
    try {
        const { otp , email } = req.body;

        if (!otp || !email) {
            return res.status(400).json({ msg: "OTP and email are required" });
        }

        const OTP = await otpmodel.findOne({email});

        if(!OTP){
            return res.status(404).json({msg : "OTP not found or expired"});
        }

        const isValid = await bcrypt.compare(otp,OTP.otpHash);

        if(!isValid){
            return res.status(400).json({msg : "Invalid OTP"});
        }

        const user = await usermodel.findByIdAndUpdate(OTP.user, { verified: true }, { new: true })

        await otpmodel.deleteMany({user : OTP.user});

        const session = await sessionmodel.create({
            userId : user._id,
            refreshtoken : "pending",
            ip : req.ip,
            userAgent : req.headers["user-agent"],
        })

        const refreshtoken = jwt.sign(
            { id: user._id, sessionId: session._id },
            process.env.REFRESH_TOKEN_SECRET, 
            { expiresIn: "7d" }
        );

        const hashedrefreshtoken = await bcrypt.hash(refreshtoken,10);
        session.refreshtoken = hashedrefreshtoken;
        await session.save();

        const accesstoken = jwt.sign(
            { id: user._id, sessionId: session._id },
            process.env.ACCESS_TOKEN_SECRET,  
            { expiresIn: "15m" }
        );  

        res.cookie("refreshtoken", refreshtoken, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            msg : "Email verified successfully. You are now logged in.",
            user : {
                name : user.name,
                email : user.email,
                verified : user.verified,
            },
            accesstoken : accesstoken,
        })
    } catch (error) {
        res.status(500).json({ msg: "Internal server error", error: error.message });
    }
}

async function resendOtp(req, res) {
    const { email } = req.body;

    const user = await usermodel.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.verified) return res.status(400).json({ msg: "Already registered" });

    // Delete old OTP and send fresh one
    await otpmodel.deleteMany({ email });

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    await otpmodel.create({ email, user: user._id, otpHash });
    await sendEmail(email, "New OTP", `Your OTP is ${otp}`, getOtpHtml(otp));

    res.status(200).json({ msg: "OTP resent successfully" });
}

async function googleAuthCallback(req, res) {
    try {
        const user = req.user; // set by passport

        const session = await sessionmodel.create({
            userId: user._id,
            refreshtoken: "pending",
            ip: req.ip,
            userAgent: req.headers["user-agent"],
        });

        const refreshtoken = jwt.sign(
            { id: user._id, sessionId: session._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        const hashedrefreshtoken = await bcrypt.hash(refreshtoken, 10);
        session.refreshtoken = hashedrefreshtoken;
        await session.save();

        const accesstoken = jwt.sign(
            { id: user._id, sessionId: session._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        res.cookie("refreshtoken", refreshtoken, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // ✅ Redirect frontend with accesstoken
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${accesstoken}`);

    } catch (error) {
        res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
    }
}

module.exports = {
    registeruser, refreshToken, logoutuser,
    logoutAlluser, loginUser, getuser,
    resendOtp, verifyemail, googleAuthCallback
};