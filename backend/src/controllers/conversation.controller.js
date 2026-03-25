const conversationmodel = require("../model/conversation.model");
const messagemodel = require("../model/message.model");

// ─────────────────────────────────────────────
// GET OR CREATE CONVERSATION
// Called when buyer clicks "Chat with Seller"
// ─────────────────────────────────────────────
async function getOrCreateConversation(req, res) {
    try {
        const { productId, sellerId } = req.body;
        const buyerId = req.user?.id; // comes from JWT token

        if (!productId || !sellerId || !buyerId) {
            return res.status(400).json({ msg: "Missing required fields (productId or sellerId)" });
        }

        // ✅ Prevent a seller from chatting with themselves
        if (buyerId.toString() === sellerId.toString()) {
            return res.status(400).json({ msg: "You cannot chat with yourself" });
        }

        // ✅ Check if conversation already exists
        // $all means BOTH IDs must be present in participants array
        // This way we don't create duplicate conversations
        let conversation = await conversationmodel.findOne({
            product: productId,
            participants: { $all: [buyerId, sellerId] },
        });

        // ✅ If no conversation exists, create a fresh one
        if (!conversation) {
            conversation = await conversationmodel.create({
                participants: [buyerId, sellerId],
                product: productId,
            });
        }

        // ✅ Populate so frontend gets useful data, not just IDs
        conversation = await conversation.populate([
            { path: "participants", select: "name email avatar" },
            { path: "product", select: "title images price" },
        ]);

        res.status(200).json({
            msg: "Conversation ready",
            conversation,
        });

    } catch (error) {
        res.status(500).json({
            msg: "Internal server error",
            error: error.message,
        });
    }
}

// ─────────────────────────────────────────────
// GET ALL CONVERSATIONS FOR LOGGED IN USER
// This is the chat list screen — like WhatsApp home
// ─────────────────────────────────────────────
async function getMyConversations(req, res) {
    try {
        const userId = req.user.id;

        // ✅ Find all conversations where this user is a participant
        // Sort by lastMessageAt so most recent chats appear first
        const conversations = await conversationmodel.find({
            participants: { $in: [userId] },
        })
        .populate("participants", "name email avatar")
        .populate("product", "title images price status")
        .sort({ lastMessageAt: -1 });

        res.status(200).json({
            msg: "Conversations fetched successfully",
            count: conversations.length,
            conversations,
        });

    } catch (error) {
        res.status(500).json({
            msg: "Internal server error",
            error: error.message,
        });
    }
}

// ─────────────────────────────────────────────
// GET MESSAGES FOR A CONVERSATION
// Called when user opens a specific chat
// Loads the full history before Socket.IO takes over
// ─────────────────────────────────────────────
async function getMessages(req, res) {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        // ✅ First verify this conversation exists
        const conversation = await conversationmodel.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ msg: "Conversation not found" });
        }

        // ✅ Security check — only participants can read messages
        // toString() is needed because MongoDB IDs are objects not strings
        const isParticipant = conversation.participants.some(
            p => p.toString() === userId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ msg: "Unauthorized" });
        }

        // ✅ Fetch all messages sorted oldest to newest
        // This is how chat history looks — oldest at top, newest at bottom
        const messages = await messagemodel.find({ conversation: conversationId })
            .populate("sender", "name avatar")
            .sort({ createdAt: 1 });

        res.status(200).json({
            msg: "Messages fetched successfully",
            count: messages.length,
            messages,
        });

    } catch (error) {
        res.status(500).json({
            msg: "Internal server error",
            error: error.message,
        });
    }
}

module.exports = { getOrCreateConversation, getMyConversations, getMessages };