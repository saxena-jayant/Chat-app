const { Server } = require("socket.io");
const Chat = require("./models/chatModel");

const socketManager = (server, connection) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000"],
      methods: ["GET", "POST"],
    },
  });

  const socketUsers = new Map();

  io.on("connection", (socket) => {
    socket.on("setUser", (userId) => {
      socket.userId = userId;
      socketUsers.set(socket.id, { userId, socket, connected: true });
      console.log(`User ${userId} is connected with socket ${socket.id}`);
    });

    // Receive and send chat
    socket.on("send-chat", async (data, acknowledgment) => {
      try {
        const chatData = {
          ...data,
          document: JSON.stringify(data.document),
          status: "sent",
        };

        const savedChat = await Chat.create(chatData);

        const targetSocket = Array.from(socketUsers.values()).find(
          (user) => user.userId === data.receiver_id
        );

        if (targetSocket) {
          targetSocket.socket.emit("receive-chat", data);
          console.log("Message sent to receiver.");
          await Chat.findByIdAndUpdate(savedChat._id, { status: "received" });
          acknowledgment({
            success: true,
            message: { ...data, status: "received", message_id: savedChat._id },
          });
        } else {
          console.log("Receiver is offline, message saved to database.");
          acknowledgment({
            success: true,
            message: { ...data, status: "sent", message_id: savedChat._id },
          });
        }
      } catch (error) {
        console.error("Error saving chat:", error);
        acknowledgment({ success: false, error: "Failed to send message" });
      }
    });

    // Update seen status
    socket.on(
      "send-receive-status",
      async (sender_id, receiver_id, acknowledgment) => {
        try {
          // Find and update all messages where status is not "received"
          const result = await Chat.updateMany(
            {
              $or: [{ sender_id: receiver_id, receiver_id: sender_id }],
              status: { $ne: "received" }, // Only update if status is not "received"
            },
            { $set: { status: "received" } } // Set status to received
          );

          console.log(
            Array.from(socketUsers.values()).find(
              (user) => user.userId === sender_id
            )
          );

          const targetSocket = Array.from(socketUsers.values()).find(
            (user) => user.userId === receiver_id
          );

          if (targetSocket) {
            targetSocket.socket.emit("update-receive-status", {
              status: "received",
            });
            console.log(
              `Updated ${result.modifiedCount} messages to 'received'`
            );
          } else {
            console.log("Receiver is offline, message saved to database.");
          }
        } catch (error) {
          console.error("Error updating seen status:", error);
          acknowledgment({ success: false, error });
        }
      }
    );

    socket.on("send-typing-status", (receiver_id) => {
      const targetSocket = Array.from(socketUsers.values()).find(
        (user) => user.userId === receiver_id
      );
      if (targetSocket) {
        targetSocket.socket.emit("update-typing-status", { status: "typing" });
        console.log("Status updated to receiver.");
      } else {
        console.log("Receiver is offline");
      }
    });

    socket.on("heartbeat", () => {
      const user = socketUsers.get(socket.id);
      if (user) {
        user.connected = true;
      }
    });

    socket.on("disconnect", () => {
      if (socketUsers.has(socket.id)) {
        console.log(`User ${socket.userId} disconnected.`);
        socketUsers.delete(socket.id);
      }
    });

    socket.on("checkUserStatus", (userId, callback) => {
      const user = Array.from(socketUsers.values()).find(
        (user) => user.userId === userId
      );
      callback(!!user?.connected);
    });
  });

  // Periodically send heartbeat messages
  setInterval(() => {
    socketUsers.forEach((user) => {
      user.connected = false;
      user.socket.emit("heartbeat");
    });
  }, 5000);

  // Remove inactive users
  setInterval(() => {
    socketUsers.forEach((user, socketId) => {
      if (!user.connected) {
        console.log(`User ${user.userId} disconnected due to inactivity.`);
        user.socket.disconnect(true);
        socketUsers.delete(socketId);
      }
    });
  }, 20000);

  return { io };
};

module.exports = { socketManager };
