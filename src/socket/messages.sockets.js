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

    socket.on("joinGroup", ({ groupId, userId }) => {
      //      socket.join(groupId);
      console.log(`👥 User ${userId} joined group ${groupId}`);

      // Emit to original group
      const originalEmit = {
        userId,
        message: `User ${userId} joined the group`,
      };
      socket.to(groupId).emit("userJoined", originalEmit);
      console.log(`📢 Emitted to groupId: ${groupId}`, originalEmit);

      if (groupId && groupId.length === 48) {
        const first24 = groupId.substring(0, 24);
        const last24 = groupId.substring(24);

        const groupId1 = first24 + last24;
        const groupId2 = last24 + first24;

        // Join the derived group IDs
        socket.join(groupId1);
        socket.join(groupId2);
        console.log(`🔗 Joined derived groups: ${groupId1}, ${groupId2}`);

        const emit1 = {
          userId,
          message: `User ${userId} joined derived groupId1`,
        };
        socket.to(groupId1).emit("userJoined", emit1);
        console.log(`📢 Emitted to groupId1: ${groupId1}`, emit1);

        const emit2 = {
          userId,
          message: `User ${userId} joined derived groupId2`,
        };
        socket.to(groupId2).emit("userJoined", emit2);
        console.log(`📢 Emitted to groupId2: ${groupId2}`, emit2);
      } else {
        console.warn("❗ messageId is missing or not 48 characters.");
      }
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
          console.log("🟢 Received sendMessage event");

          let updatedMessage;
          const receivers = Array.isArray(receiverId)
            ? receiverId
            : [receiverId];
          console.log("📥 Receivers:", receivers);

          // Handle editing
          if (editingTrue) {
            console.log("✏️ Editing message:", messageId);
            updatedMessage = await Message.findOneAndUpdate(
              { messageId },
              { $set: { text: message, editingTrue: true, status: "edited" } },
              { new: true }
            );

            if (!updatedMessage) {
              console.log(`❌ Message ${messageId} not found for editing.`);
              return;
            }

            console.log(`✅ Message ${messageId} edited.`);

            if (groupId && groupId.length === 48) {
              const first24 = groupId.substring(0, 24);
              const last24 = groupId.substring(24);
              const groupId1 = first24 + last24;
              const groupId2 = last24 + first24;

              console.log(
                "📡 Broadcasting edited message to:",
                groupId1,
                groupId2
              );
              socket.to(groupId1).emit("newMessage", updatedMessage);
              socket.to(groupId2).emit("newMessage", updatedMessage);
            }

            return;
          }

          if (reactionTrue) {
            console.log("💥 Reaction triggered for message:", messageId);

            const messages = await Message.find({ messageId }); // Get both entries

            if (!messages || messages.length !== 2) {
              console.log(
                "❌ Could not find both message copies for reaction."
              );
              return;
            }

            console.log("📨 Found message copies:", messages);

            const updatedMessages = [];

            for (let messageDoc of messages) {
              // Filter out existing reaction from this reactor if any
              messageDoc.reactions = messageDoc.reactions.filter(
                (r) => r.reactorId !== reactorId
              );

              // Add the new reaction
              messageDoc.reactions.push({ reactorId, reaction: reactions });

              const updated = await Message.findOneAndUpdate(
                { _id: messageDoc._id },
                { reactions: messageDoc.reactions, reactionTrue: true },
                { new: true }
              );

              if (updated) {
                console.log(`✅ Updated message ${updated._id}`);
                updatedMessages.push(updated);
              } else {
                console.log(`❌ Failed to update message ${messageDoc._id}`);
              }
            }

            if (
              updatedMessages.length === 2 &&
              groupId &&
              groupId.length === 48
            ) {
              const first24 = groupId.substring(0, 24);
              const last24 = groupId.substring(24);
              const groupId1 = first24 + last24;
              const groupId2 = last24 + first24;

              console.log("📡 Broadcasting updated reactions to both groups:");
              console.log("➡️ Group 1:", groupId1);
              console.log("➡️ Group 2:", groupId2);

              // Emit each updated message to its group
              socket.to(groupId1).emit("newMessage", updatedMessages[0]);
              socket.to(groupId2).emit("newMessage", updatedMessages[1]);
            }
          }

          // Handle reply
          // Handle reply
          if (replyTrue) {
            console.log(`💬 Replying to message ${repliedMessageId}`);

            if (groupId && groupId.length === 48) {
              const first24 = groupId.substring(0, 24);
              const last24 = groupId.substring(24);
              const groupId1 = first24 + last24;
              const groupId2 = last24 + first24;

              const newReply1 = new Message({
                messageId,
                messagesArrayID: groupId1,
                text: message,
                senderId,
                receiverId: receivers,
                repliedMessageId,
                repliedMessage,
                replyTrue: true,
                status: "delivered",
              });

              const newReply2 = new Message({
                messageId,
                messagesArrayID: groupId2,
                text: message,
                senderId,
                receiverId: receivers,
                repliedMessageId,
                repliedMessage,
                replyTrue: true,
                status: "delivered",
              });

              await newReply1.save();
              await newReply2.save();

              console.log(`✅ Reply messages saved for ${repliedMessageId}`);
              console.log("📩 Saved replies:");
              console.log("➡️ newReply1:", newReply1);
              console.log("➡️ newReply2:", newReply2);

              console.log("📡 Broadcasting reply to both groups at once:");
              console.log("➡️ Group 1:", groupId1);
              console.log("➡️ Group 2:", groupId2);

              // Emit both at once using a map
              const groupEmitMap = [
                { groupId: groupId1, message: newReply1 },
                { groupId: groupId2, message: newReply2 },
              ];

              groupEmitMap.forEach(({ groupId, message }) => {
                socket.to(groupId).emit("newMessage", message);
              });
            }

            return;
          }

          // Handle normal message
          if (groupId && groupId.length === 48) {
            console.log("📨 Sending a new message");

            const first24 = groupId.substring(0, 24);
            const last24 = groupId.substring(24);
            const groupId1 = first24 + last24;
            const groupId2 = last24 + first24;

            const newMessage1 = new Message({
              messageId,
              messagesArrayID: groupId1,
              text: message,
              senderId,
              receiverId: receivers,
              reactions: [],
              repliedMessageId: "",
              repliedMessage: "",
              translations: translations || {},
              reactionTrue,
              editingTrue,
              deleteTrue,
              replyTrue,
              status: "delivered",
            });

            const newMessage2 = new Message({
              messageId,
              messagesArrayID: groupId2,
              text: message,
              senderId,
              receiverId: receivers,
              reactions: [],
              repliedMessageId: "",
              repliedMessage: "",
              translations: translations || {},
              reactionTrue,
              editingTrue,
              deleteTrue,
              replyTrue,
              status: "delivered",
            });

            await newMessage1.save();
            await newMessage2.save();
            console.log("✅ Messages saved:");
            console.log("➡️ newMessage1:", newMessage1);
            console.log("➡️ newMessage2:", newMessage2);

            console.log("📡 Broadcasting new messages to groups:");
            console.log("➡️ Group 1:", groupId1);
            console.log("➡️ Group 2:", groupId2);

            const groupEmitMap = [
              { groupId: groupId1, message: newMessage1 },
              { groupId: groupId2, message: newMessage2 },
            ];

            groupEmitMap.forEach(({ groupId, message }) => {
              socket.to(groupId).emit("newMessage", message);
            });

            const deliveredMessage1 = await Message.findOneAndUpdate(
              { messageId, messagesArrayID: groupId1 },
              { status: "delivered" },
              { new: true }
            );

            const deliveredMessage2 = await Message.findOneAndUpdate(
              { messageId, messagesArrayID: groupId2 },
              { status: "delivered" },
              { new: true }
            );

            console.log("✅ Messages marked as delivered:");
            console.log("➡️ Delivered message 1:", deliveredMessage1);
            console.log("➡️ Delivered message 2:", deliveredMessage2);
          }
        } catch (error) {
          console.error("❌ Error sending message:", error);
        }
      }
    );

    socket.on(
      "sendMessages",
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

          const receivers = Array.isArray(receiverId)
            ? receiverId
            : [receiverId];

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
                receiverId: receivers,
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
            receiverId: receivers,
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
            ? `${userId}${contactUserId}`
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
