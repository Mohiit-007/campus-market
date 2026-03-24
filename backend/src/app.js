const express = require("express");
const morgan = require("morgan");
const cookieparser = require("cookie-parser");
const passport = require("./config/passport.config"); 
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const conversationRoutes = require("./routes/conversation.routes")

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieparser());
app.use(passport.initialize());
app.use('/user', authRoutes);
app.use('/api', productRoutes);
app.use('/api', conversationRoutes);

module.exports = app;