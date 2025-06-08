const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendWaitlistConfirmation = async (toEmail) => {
  const mailOptions = {
    from: `"Chat Wazobia AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "You're on the Waitlist – Chat Wazobia AI",
    html: `
      <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <style>
          body {
            background-color: #000;
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: #ffffff;
            padding: 24px;
            background-image: url('https://i.imgur.com/v536aro.jpg');
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
          }
          .overlay {
            background-color: #000;
            padding: 30px;
            border-radius: 8px;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          h2, h3 {
            font-weight: 700;
            color: #ffffff;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          h2 {
            font-size: 28px;
            margin-bottom: 20px;
          }
          h3 {
            font-size: 22px;
            margin-top: 30px;
          }
          p, li {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 16px;
            color: #ffffff;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          li {
            list-style-type: none;
          }
          .bold {
            font-weight: 700;
          }
          a {
            color: #05D75C;
            font-weight: bold;
            text-decoration: none;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          footer {
            margin-top: 50px;
            font-style: italic;
            color: #ffffff;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
        </style>
      </head>
      <body>
        <div class="overlay">
          <img src="https://i.imgur.com/5q9Eoum.png" alt="Chat Wazobia AI Logo" style="max-width: 40px; margin-bottom: 30px;" />
          <h2>Welcome to <span class="bold">Chat Wazobia AI</span></h2>

          <p><span class="bold">You're officially on the waitlist!</span> We're thrilled to have you join our early community shaping the future of communication in Africa and beyond.</p>

          <p style="font-size: 18px; color: #05D75C; font-weight: bold;">Mobile App Coming Soon!</p>

          <h3>Our Features</h3>
          <ul>
            <li><span class="bold">AI Translation:</span> Communicate across 2000+ African languages in real time.</li>
            <li><span class="bold">HD Voice/Video Calls:</span> Seamless, high-quality conversations anywhere.</li>
            <li><span class="bold">AI Photo Studio:</span> Create and enhance images with powerful AI tools.</li>
            <li><span class="bold">Interactive Games:</span> Culturally-rich games like Eyo to stay entertained.</li>
            <li><span class="bold">Private Messaging:</span> End-to-end encrypted chats and calls.</li>
            <li><span class="bold">Language Learning:</span> Personalized lessons and quizzes to grow your skills.</li>
            <li><span class="bold">Offline Mode:</span> Access key features even without internet.</li>
            <li><span class="bold">Cultural Community:</span> Engage in forums and connect with others.</li>
            <li><span class="bold">Smart Notifications:</span> Stay in the loop without being overwhelmed.</li>
          </ul>

          <p>We’ll keep you updated with exclusive sneak peeks and beta access opportunities as we launch.</p>

          <p>In the meantime, visit <a  style="font-size: 18px; color: #05D75C; font-weight: bold;href="https://www.chatwazobiaai.com" target="_blank">www.chatwazobiaai.com</a> to learn more and stay connected.</p>

          <footer>– The Chat Wazobia AI Team</footer>
        </div>
      </body>
      </html>
      `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendWaitlistConfirmation };
