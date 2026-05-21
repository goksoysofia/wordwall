const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// Manually parse .env.local
const envPath = path.join(process.cwd(), ".env.local");
let gmailUser = "";
let gmailPass = "";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts[0] === "GMAIL_USER") {
      gmailUser = parts[1].trim();
    } else if (parts[0] === "GMAIL_APP_PASSWORD") {
      gmailPass = parts[1].trim();
    }
  });
}

console.log("Parsed GMAIL_USER:", gmailUser);
console.log("Parsed GMAIL_APP_PASSWORD:", gmailPass ? "SET" : "NOT SET");

if (!gmailUser || !gmailPass) {
  console.error("GMAIL_USER or GMAIL_APP_PASSWORD is missing in .env.local!");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
});

async function main() {
  try {
    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from: `"${gmailUser}" <${gmailUser}>`,
      to: gmailUser,
      subject: "WordWall SMTP Test E-postası 🚀",
      text: "Gmail SMTP bağlantısı başarıyla kuruldu!",
      html: "<b>Gmail SMTP bağlantısı başarıyla kuruldu!</b>",
    });
    console.log("Email sent successfully!", info.messageId);
  } catch (error) {
    console.error("Error sending test email:", error);
  }
}

main();
