const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const authRoutes = require("../src/routes/auth.routes");
const contactsRoutes = require("../src/routes/contacts.routes");
const initializeSocket = require("./socket/messages.sockets"); // Import socket logic
const messageRoutes = require("../src/routes/message.routes");
const waitlistRoutes = require("./routes/wailtlist.router");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 2000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/waitlist", waitlistRoutes);

const server = http.createServer(app);
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
