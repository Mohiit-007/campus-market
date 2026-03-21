const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required : true,
        }
    ],
    product : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "product",
        required: true,
    },
    lastMessage : {
        type : String,
        default : "",
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
    },
},{timestamps : true});

conversationSchema.index({ product: 1, participants: 1 }, { unique: true });

const Conversation = mongoose.model("conversation",conversationSchema);

module.exports = Conversation;