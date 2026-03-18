require("dotenv").config();
const app = require("./src/app")
const connectDB = require("./src/config/db")

connectDB();

app.get('/',(req,res)=>{
    res.send("hello from server");
})

app.listen(8000,()=>{
    console.log('server is running')
})