const { Server } = require("socket.io");
const User = require("../models/user.model"); // Assuming you have a User model
const UserContacts = require("../models/contacts.model");
const Message = require("../models/message.model");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    socket.on("joinRoom", (userId) => {
      socket.join(userId);
      console.log(`📌 User ${userId} joined personal room: ${userId}`);
    });

    socket.on("joinGroup", ({ groupId, userId }) => {
      socket.join(groupId);
      console.log(`👥 User ${userId} joined group ${groupId}`);
      socket.to(groupId).emit("userJoined", {
        userId,
        message: `User ${userId} joined the group`,
      });
    });

    socket.on("leaveGroup", ({ groupId, userId }) => {
      socket.leave(groupId);
      console.log(`👋 User ${userId} left group ${groupId}`);

      socket
        .to(groupId)
        .emit("userLeft", { userId, message: `User ${userId} left the group` });
    });

    socket.on(
      "sendMessage",
      async ({
        groupId,
        senderId,
        message,
        receiverId,
        messageId,
        reactions,
        repliedMessageId,
        translations,
        reactionTrue,
        editingTrue,
        deleteTrue,
        replyTrue,
        reactorId,
        repliedMessage,
      }) => {
        try {
          let updatedMessage;

          if (editingTrue) {
            updatedMessage = await Message.findOneAndUpdate(
              { messageId },
              { $set: { text: message, editingTrue: true, status: "edited" } },
              { new: true }
            );

            if (!updatedMessage) {
              console.log(`❌ Message ${messageId} not found for editing.`);
              return;
            }

            console.log(`✏️ Message ${messageId} edited.`);
            io.to(groupId).emit("newMessage", updatedMessage); // 🔥 Ensure edited message is emitted
            return;
          }

          if (reactionTrue) {
            let messageDoc = await Message.findOne({ messageId });

            if (!messageDoc) {
              console.log("❌ Message not found for reaction.");
              return;
            }

            messageDoc.reactions = messageDoc.reactions.filter(
              (r) => r.reactorId !== reactorId
            );

            messageDoc.reactions.push({ reactorId, reaction: reactions });

            updatedMessage = await Message.findOneAndUpdate(
              { messageId },
              { reactions: messageDoc.reactions, reactionTrue: true },
              { new: true }
            );

            if (updatedMessage) {
              console.log(`👍 Reaction updated for message ${messageId}`);
              io.to(groupId).emit("newMessage", updatedMessage);
            } else {
              console.log(
                `❌ Failed to update reaction for message ${messageId}`
              );
            }
            return;
          }

          if (replyTrue) {
            try {
              //   const repliedMessage = await Message.findOne({
              //     messageId: repliedMessageId,
              //   });

              //   if (!repliedMessage) {
              //     console.error("❌ Replied message not found!");
              //     return;
              //   }

              const newReply = new Message({
                messageId,
                messagesArrayID: groupId,
                text: message,
                senderId,
                receiverId,
                repliedMessageId,
                repliedMessage: repliedMessage,
                replyTrue: true,
                status: "delivered",
              });

              await newReply.save();

              console.log(
                `💬 New reply to message ${repliedMessageId} created.`
              );
              io.to(groupId).emit("newMessage", newReply);
            } catch (error) {
              console.error("❌ Error creating reply message:", error);
            }
            return;
          }

          updatedMessage = new Message({
            messageId,
            messagesArrayID: groupId,
            text: message,
            senderId,
            receiverId,
            reactions: [],
            repliedMessageId: "",
            repliedMessage: "",
            translations: translations || {},
            reactionTrue,
            editingTrue,
            deleteTrue,
            replyTrue,
            status: "pending", // Initially pending
          });

          await updatedMessage.save();
          console.log(`📩 New message from ${senderId} in group ${groupId}`);

          updatedMessage = await Message.findOneAndUpdate(
            { messageId },
            { status: "delivered" }, // Change status to delivered
            { new: true }
          );

          io.to(groupId).emit("newMessage", updatedMessage);
        } catch (error) {
          console.error("❌ Error sending message:", error);
        }
      }
    );
    socket.on("updateContacts", async ({ userId, contacts }) => {
        try {
          console.log("📤 Receiving contacts:", contacts, "from user:", userId);
          const phoneNumbers = contacts.map((c) => c.phoneNumber);
          const users = await User.find({ phoneNumber: { $in: phoneNumbers } });
      
          const userMap = {};
          users.forEach((user) => {
            userMap[user.phoneNumber] = user._id.toString();
          });
      
          let userContacts = await UserContacts.findOne({ userId });
      
          if (!userContacts) {
            userContacts = new UserContacts({ userId, contacts: [] });
          }
      
          const newPhoneNumbers = new Set(contacts.map((c) => c.phoneNumber));
      
          userContacts.contacts = userContacts.contacts.filter((c) =>
            newPhoneNumbers.has(c.phoneNumber)
          );
      
          for (let newContact of contacts) {
            const existingIndex = userContacts.contacts.findIndex(
              (c) => c.phoneNumber === newContact.phoneNumber
            );
      
            const contactUserId = userMap[newContact.phoneNumber] || null;
            const messagesArrayID = contactUserId
              ? `${userId}xxxxxxx${contactUserId}`
              : null;
      
            let lastMessages = [];
            if (messagesArrayID) {
              lastMessages = await Message.find({ messagesArrayID })
                .sort({ createdAt: -1 })
                .limit(20)
                .lean(); // 🔥 Fetch last 20 messages
      
              lastMessages = lastMessages.map((msg) => msg._id); // Store only IDs in `messages`
            }
      
            if (existingIndex !== -1) {
              userContacts.contacts[existingIndex] = {
                ...userContacts.contacts[existingIndex],
                ...newContact,
                contactUserId,
                messagesArrayID,
                messages: lastMessages, // ✅ Store last 20 messages
                updatedAt: new Date(),
              };
            } else {
              userContacts.contacts.push({
                ...newContact,
                contactUserId,
                messagesArrayID,
                messages: lastMessages, // ✅ Store last 20 messages
              });
            }
          }
      
          await userContacts.save();
      
          // Populate the last messages before emitting
          await userContacts.populate("contacts.messages");
      
          // Emit updated contacts with last 20 messages
          io.to(userId).emit("contactsUpdated", userContacts.contacts);
          console.log(`📤 Emitted contactsUpdated to room: ${userId}`);
        } catch (error) {
          console.error("❌ Error updating contacts:", error);
        }
      });

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initializeSocket;
