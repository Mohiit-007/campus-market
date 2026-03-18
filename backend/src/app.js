const express = require("express");
const morgan = require("morgan");
const cookieparser = require("cookie-parser");
const passport = require("./config/passport.config"); 
const userRoutes = require("./routes/auth.routes");

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieparser());
app.use(passport.initialize());
app.use('/user', userRoutes);

module.exports = app;