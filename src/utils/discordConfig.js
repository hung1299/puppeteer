const { Client, GatewayIntentBits } = require("discord.js");
const { NEW_BOT_TOKEN } = require("./constant");

class DiscordConfig {
    static instance = null;
    static getInstance() {
        if (!this.instance) {
            this.instance = new DiscordConfig();
        }
        return this.instance;
    }

    mapSendedMessageTemp = {};

    client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
        ],
        partials: ["MESSAGE", "CHANNEL", "REACTION"],
    });

    init() {
        this.client.login(NEW_BOT_TOKEN);
        this.client.on("ready", async () => {
            console.log(`Logged in as ${this.client.user.tag}!`);
        });
    }

    logout() {
        this.client.destroy();
    }

    async send({ messageEmbed, userID, message }) {
        let currentTime = new Date().getTime();
        this.mapSendedMessageTemp[userID] = currentTime;
        try {
            const discordRequestUser = await this.client.users.fetch(
                userID,
                false
            );
            await discordRequestUser?.send(
                message ?? { embeds: [messageEmbed] }
            );
        } catch (err) {
            console.log("ERROR", err);
        }
    }

    async sendMessage({ messageEmbed, userID, message, spam }) {
        let currentTime = new Date().getTime();
        let spamBot = spam ?? false;
        if (spamBot == true) {
            await this.send({
                messageEmbed: messageEmbed,
                userID: userID,
                message: message,
            });
        } else {
            if (
                !this.mapSendedMessageTemp[userID] ||
                currentTime - this.mapSendedMessageTemp[userID] > 1000
            ) {
                await this.send({
                    messageEmbed: messageEmbed,
                    userID: userID,
                    message: message,
                });
            }
        }
    }

    async sendNotification({ messageEmbed, channelId, message }) {
        try {
            const discordRequestChannel = await this.client.channels.fetch(
                channelId
            );
            await discordRequestChannel?.send(
                message ?? { embeds: [messageEmbed] }
            );
        } catch (err) {
            console.log("ERROR", err);
        }
    }
}

exports.DiscordConfig = DiscordConfig;
