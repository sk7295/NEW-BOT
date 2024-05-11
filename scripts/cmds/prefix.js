const fs = require("fs-extra");
const axios = require("axios");

// Function to generate random message
function generateRandomMessage(messages) {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

module.exports = {
  config: {
    name: "prefix",
    version: "1.0",
    author: "SHANKAR SUMAN",
    countDown: 5,
    role: 0,
    shortDescription: "no-prefix",
    longDescription: "Bot aapko hindi mein jawab dega",
    category: "non-prefix",
    guide: {
      en: "{p}{n}",
    }
  },

  onStart: async function ({ }) { },

  onChat: async function ({ api, event, args, Threads, userData }) {
    const { threadID, senderID } = event;
    // Fetch sender details
    const senderInfo = await api.getUserInfo(senderID);
    // Get sender name from sender details
    const senderName = senderInfo[senderID].name;

    // Trigger words and their corresponding replies and GIF links
    const triggers = {
      "prefix": {
        options: ["prefix", "PREFIX", "Prefix", "perfix"],
        gifLinks: [
          "https://i.ibb.co/x7pLGVG/image.jpg",
          "https://i.ibb.co/YbcMKng/image.jpg",
          "https://i.ibb.co/mSrQ2L7/image.jpg",
          "https://i.ibb.co/1GqwqBq/image.jpg",          
          // Add more GIF links here as per your requirement
        ],
        replies: ["" + senderName + " my prefix is [ 𓆩 # 𓆪 ]\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\
      SHANKAR-PROJECT\n ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n𝗦𝗢𝗠𝗘 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 𝗧𝗛𝗔𝗧 𝗠𝗔𝗬 𝗛𝗘𝗟𝗣 𝗬𝗢𝗨:\n➥ &help [number of page] -> see commands\n➥ &sim [message] -> talk to bot\n➥ &callad [message] -> report any problem encountered\n➥ &help [command] -> information and usage of command\n\nHave fun using it enjoy!❤️\nBot Developer: https://www.facebook.com/shankar.suman.98622733"]
      }
    };

    // Check if message body contains any trigger words
    for (const trigger in triggers) {
      if (triggers[trigger].options.some(option => new RegExp(`\\b${option}\\b`, 'i').test(event.body))) {
        const { gifLinks, replies } = triggers[trigger];

        // Generate random GIF link
        const gifLink = gifLinks[Math.floor(Math.random() * gifLinks.length)];
        // Generate random message
        const replyMessage = generateRandomMessage(replies);

        try {
          // Fetch GIF data
          const gifData = await axios.get(gifLink, { responseType: "stream" });
          // Send GIF and message as attachments
          api.sendMessage({
            attachment: gifData.data,
            body: replyMessage,
            mentions: [{ tag: senderID, id: senderID }]
          }, threadID);
        } catch (error) {
          console.error("GIF fetch karne mein error:", error);
        }

        return; // Message bhejne ke baad loop se bahar nikalna
      }
    }

    // Agar koi trigger word nahi milta, to kuch nahi karna
  }
};
