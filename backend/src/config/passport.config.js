const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const usermodel = require("../model/user.model");

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const name  = profile.displayName;
        console.log(profile);

        let user = await usermodel.findOne({ email });

        if (user) {
            // User exists — link googleId if not already linked
            if (!user.googleId) {
                user.googleId = profile.id;
                await user.save();
            }
            return done(null, user);
        }

        // New user — create with Google profile
        user = await usermodel.create({
            name,
            email,
            googleId:     profile.id,
            avatar:       profile.photos?.[0]?.value,
            verified:     true,                      // Google already verified email
            authProvider: "google",
            password:     "GOOGLE_OAUTH_NO_PASSWORD", // placeholder
        });

        return done(null, user);

    } catch (error) {
        return done(error, null);
    }
}));

module.exports = passport;