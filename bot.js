const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// โหลด Service Account Credentials
const SHEETDB_API_URL = process.env.SHEETDB_API_URL;

// รายชื่อคอลัมน์ที่รองรับ
const COLUMN_MAPPING = {
  rvd: "rvd", // Red Velvet Dragon
  aod: "aod", // Avatar of Destiny
  la: "la", // Living Abyss
};

// ฟังก์ชันเพิ่มข้อมูลลง Google Sheets
async function addDataToSheet(username, category, score) {
  if (!COLUMN_MAPPING[category]) {
    return `ประเภทคะแนน "${category}" ไม่ถูกต้อง! โปรดใช้ rvd, aod หรือ la`;
  }

  try {
    console.log(`🔍 กำลังดึงข้อมูลจาก SheetDB: ${SHEETDB_API_URL}/search?NAME=${username}`);
    const { data } = await axios.get(`${SHEETDB_API_URL}/search?NAME=${username}`);
    console.log("✅ Data ที่ดึงมา:", data);

    let userData = data[0];

    if (!userData) {
      console.log("🆕 ไม่พบผู้ใช้ เพิ่มข้อมูลใหม่...");
      const newData = [{ NAME: username, [COLUMN_MAPPING[category]]: score }];
      console.log("📤 กำลังส่งข้อมูลไปที่ SheetDB:", newData);

      await axios.post(SHEETDB_API_URL, { data: newData });
      return `เพิ่มคะแนนให้ ${username} ในหมวด ${category.toUpperCase()} สำเร็จ!`;
    } else {
      console.log("♻️ พบข้อมูลเดิม อัปเดตคะแนน...");
            // เช็คและอัปเดตข้อมูล
      const updateData = {};

            // เพิ่มคะแนนในหมวดหมู่ที่มีข้อมูล
      if (score !== '' && score !== null) {
        updateData[COLUMN_MAPPING[category]] = score;
      }
      
            // ตรวจสอบว่าอัปเดตข้อมูลที่มีการเปลี่ยนแปลงหรือไม่
      if (Object.keys(updateData).length === 0) {
        return `ไม่พบคะแนนใหม่ที่จะอัปเดต!`;
            }
      const usernameEncoded = encodeURIComponent(username); // ป้องกันปัญหาชื่อที่มีช่องว่าง
      console.log(`📤 กำลังอัปเดต NAME=${usernameEncoded} ใน SheetDB:`, updateData);
      await axios.patch(`${SHEETDB_API_URL}/NAME/${usernameEncoded}`, { data: updateData });
      return `อัปเดตคะแนนให้ ${username} ในหมวด ${category.toUpperCase()} สำเร็จ!`;
    }
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error.response ? error.response.data : error.message);
    return "เกิดข้อผิดพลาดในการบันทึกข้อมูล!";
  }
}



  
  client.on("messageCreate", async (message) => {
    if (!message.content.startsWith("!addscore") || message.author.bot) return;
  
    const args = message.content.split(" ");
    if (args.length < 4) {
      return message.reply("ใช้คำสั่ง: `!addscore [ชื่อ] [ประเภท] [คะแนน]` เช่น `!addscore Moniper rvd 10210345564`");
    }
  
    const username = args[1];
    const category = args[2].toLowerCase();
    const score = parseInt(args[3]);
  
    if (isNaN(score)) {
      return message.reply("คะแนนต้องเป็นตัวเลข!");
    }
  
    try {
      const response = await addDataToSheet(username, category, score);
      message.reply(response);
    } catch (error) {
      console.error(error);
      message.reply("เกิดข้อผิดพลาดในการบันทึกข้อมูล!");
    }
  });
  
  client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });
  
  client.login(process.env.DISCORD_BOT_TOKEN);