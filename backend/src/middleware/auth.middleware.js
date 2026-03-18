const jwt = require("jsonwebtoken");
const sessionmodel = require("../model/session.model");

async function verifyAccessToken(req,res,next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ msg: "Access token not found" });
        }

        const accesstoken = authHeader.split(" ")[1];
        
        const decoded = jwt.verify(accesstoken,process.env.ACCESS_TOKEN_SECRET);
        if(!decoded){
            return res.status(400).json({msg : "token not found"});
        }
        const session = await sessionmodel.findOne({
            _id: decoded.sessionId,
            revoke: false,
        });

        if (!session) {
            return res.status(401).json({ msg: "Session expired or revoked" });
        }

        req.user = decoded; 
        next();

    } catch (error) {
        return res.status(401).json({ msg: "Invalid or expired access token" });
    }
}

module.exports = verifyAccessToken;