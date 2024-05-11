const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;
const doNotDelete = "[ 🐐 | Goat Bot V2 ]";

// Update the imgBB image links
const imageLinks = [
		"https://i.ibb.co/YbcMKng/image.jpg",
		"https://i.ibb.co/mSrQ2L7/image.jpg",
		"https://i.ibb.co/1GqwqBq/image.jpg"
];

module.exports = {
		config: {
				name: "help",
				version: "1.20",
				author: "NTKhang",
				countDown: 5,
				role: 0,
				shortDescription: {
						vi: "Xem cách dùng lệnh",
						en: "View command usage"
				},
				longDescription: {
						vi: "Xem cách sử dụng của các lệnh",
						en: "View command usage"
				},
				category: "info",
				guide: {
						vi: "   {pn} [để trống | <số trang> | <tên lệnh>]"
								+ "\n   {pn} <command name> [-u | usage | -g | guide]: chỉ hiển thị phần hướng dẫn sử dụng lệnh"
								+ "\n   {pn} <command name> [-i | info]: chỉ hiển thị phần thông tin về lệnh"
								+ "\n   {pn} <command name> [-r | role]: chỉ hiển thị phần quyền hạn của lệnh"
								+ "\n   {pn} <command name> [-a | alias]: chỉ hiển thị phần tên viết tắt của lệnh",
						en: "{pn} [empty | <page number> | <command name>]"
								+ "\n   {pn} <command name> [-u | usage | -g | guide]: only show command usage"
								+ "\n   {pn} <command name> [-i | info]: only show command info"
								+ "\n   {pn} <command name> [-r | role]: only show command role"
								+ "\n   {pn} <command name> [-a | alias]: only show command alias",
						attachment: imageLinks
				},
				priority: 1
		},

		langs: {
				// Language configurations...
		},

		onStart: async function ({ message, args, event, threadsData, getLang, role, globalData }) {
				const langCode = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.language;
				let customLang = {};
				const pathCustomLang = path.normalize(`${process.cwd()}/languages/cmds/${langCode}.js`);
				if (fs.existsSync(pathCustomLang))
						customLang = require(pathCustomLang);

				const { threadID } = event;
				const threadData = await threadsData.get(threadID);
				const prefix = getPrefix(threadID);
				let sortHelp = threadData.settings.sortHelp || "name";
				if (!["category", "name"].includes(sortHelp))
						sortHelp = "name";
				const commandName = (args[0] || "").toLowerCase();
				let command = commands.get(commandName) || commands.get(aliases.get(commandName));
				const aliasesData = threadData.data.aliases || {};

				if (!command) {
						for (const cmdName in aliasesData) {
								if (aliasesData[cmdName].includes(commandName)) {
										command = commands.get(cmdName);
										break;
								}
						}
				}

				if (!command) {
						const globalAliasesData = await globalData.get('setalias', 'data', []);
						for (const item of globalAliasesData) {
								if (item.aliases.includes(commandName)) {
										command = commands.get(item.commandName);
										break;
								}
						}
				}

				const formSendMessage = {};
				const configCommand = command.config;

				let guide = configCommand.guide?.[langCode] || configCommand.guide?.["en"];
				if (guide == undefined)
						guide = customLang[configCommand.name]?.guide?.[langCode] || customLang[configCommand.name]?.guide?.["en"];

				guide = guide || { body: "" };
				if (typeof guide == "string")
						guide = { body: guide };
				const guideBody = guide.body
						.replace(/\{prefix\}|\{p\}/g, prefix)
						.replace(/\{name\}|\{n\}/g, configCommand.name)
						.replace(/\{pn\}/g, prefix + configCommand.name);

				const aliasesString = configCommand.aliases ? configCommand.aliases.join(", ") : getLang("doNotHave");
				const aliasesThisGroup = threadData.data.aliases ? (threadData.data.aliases[configCommand.name] || []).join(", ") : getLang("doNotHave");

				let roleOfCommand = configCommand.role;
				let roleIsSet = false;
				if (threadData.data.setRole?.[configCommand.name]) {
						roleOfCommand = threadData.data.set
        role[configCommand.name];
        roleIsSet = true;
    }

    const roleText = roleOfCommand == 0 ?
        (roleIsSet ? getLang("roleText0setRole") : getLang("roleText0")) :
        roleOfCommand == 1 ?
            (roleIsSet ? getLang("roleText1setRole") : getLang("roleText1")) :
            getLang("roleText2");

    const author = configCommand.author;
    const descriptionCustomLang = customLang[configCommand.name]?.longDescription;
    let description = checkLangObject(configCommand.longDescription, langCode);
    if (description == undefined)
        if (descriptionCustomLang != undefined)
            description = checkLangObject(descriptionCustomLang, langCode);
        else
            description = getLang("doNotHave");

    let sendWithAttachment = false;

    if (args[1]?.match(/^-g|guide|-u|usage$/)) {
        formSendMessage.body = getLang("onlyUsage", guideBody.split("\n").join("\n│"));
        sendWithAttachment = true;
    } else if (args[1]?.match(/^-a|alias|aliase|aliases$/))
        formSendMessage.body = getLang("onlyAlias", aliasesString, aliasesThisGroup);
    else if (args[1]?.match(/^-r|role$/))
        formSendMessage.body = getLang("onlyRole", roleText);
    else if (args[1]?.match(/^-i|info$/))
        formSendMessage.body = getLang("onlyInfo", configCommand.name, description, aliasesString, aliasesThisGroup, configCommand.version, roleText, configCommand.countDown || 1, author || "");
    else {
        formSendMessage.body = getLang("getInfoCommand", configCommand.name, description, aliasesString, aliasesThisGroup, configCommand.version, roleText, configCommand.countDown || 1, author || "", `${guideBody.split("\n").join("\n│")}`);
        sendWithAttachment = true;
    }

    if (sendWithAttachment && guide.attachment) {
        if (Array.isArray(guide.attachment)) {
            const promises = [];
            formSendMessage.attachment = [];

            for (const imageUrl of guide.attachment) {
                const pathFile = path.normalize(`/tmp/${path.basename(imageUrl)}`);
                const getFilePromise = axios.get(imageUrl, { responseType: 'arraybuffer' })
                    .then(response => {
                        fs.writeFileSync(pathFile, Buffer.from(response.data));
                    });

                promises.push(getFilePromise);
                formSendMessage.attachment.push(fs.createReadStream(pathFile));
            }

            await Promise.all(promises);
        }
    }

    return message.reply(formSendMessage);
}
};

function checkLangObject(data, langCode) {
if (typeof data == "string")
    return data;
if (typeof data == "object" && !Array.isArray(data))
    return data[langCode] || data.en || undefined;
return undefined;
}

function cropContent(content, max) {
if (content.length > max) {
    content = content.slice(0, max - 3);
    content = content + "...";
}
return content;
}
