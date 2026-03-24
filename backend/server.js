require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const messagemodel = require("./src/model/message.model");
const conversationmodel = require("./src/model/conversation.model");

connectDB();

app.get('/', (req, res) => {
    res.send("hello from server");
});

// ✅ Step 1 — wrap Express in HTTP server
const server = http.createServer(app);

// ✅ Step 2 — attach Socket.IO to HTTP server
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    },
});

// ✅ Step 3 — verify JWT before any socket connects
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication required"));
        }
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        socket.userId = decoded.id;
        next();
    } catch (error) {
        next(new Error("Invalid token"));
    }
});

// ✅ Step 4 — handle all socket events
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // user joins their own personal room
    socket.join(socket.userId);

    // user opens a chat window
    socket.on("join_conversation", (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // user closes a chat window
    socket.on("leave_conversation", (conversationId) => {
        socket.leave(conversationId);
    });

    // user sends a message
    socket.on("send_message", async (data) => {
        try {
            const { conversationId, content } = data;

            // always save to DB first
            const message = await messagemodel.create({
                conversation: conversationId,
                sender: socket.userId,
                content,
            });

            // update conversation preview
            await conversationmodel.findByIdAndUpdate(conversationId, {
                lastMessage: content,
                lastMessageAt: new Date(),
            });

            // send to everyone in the room
            io.to(conversationId).emit("receive_message", {
                _id: message._id,
                conversation: conversationId,
                sender: socket.userId,
                content: message.content,
                read: message.read,
                createdAt: message.createdAt,
            });

        } catch (error) {
            socket.emit("error", { msg: "Failed to send message" });
        }
    });

    // user opens a conversation — mark messages as read
    socket.on("mark_read", async (conversationId) => {
        try {
            await messagemodel.updateMany(
                {
                    conversation: conversationId,
                    sender: { $ne: socket.userId },
                    read: false,
                },
                { read: true }
            );

            io.to(conversationId).emit("messages_read", { conversationId });

        } catch (error) {
            socket.emit("error", { msg: "Failed to mark messages as read" });
        }
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.userId}`);
    });
});

// ✅ Step 5 — server.listen not app.listen
server.listen(8000, () => {
    console.log('server is running');
});