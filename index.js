require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const blockedWords = require('./blockedWords.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`✅ Bot listo como ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const msgLower = message.content.toLowerCase();

    for (const word of blockedWords) {
        if (msgLower.includes(word.toLowerCase())) {
            await message.delete();
            break;
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
