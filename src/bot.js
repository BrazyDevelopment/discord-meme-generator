const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
});

const prefix = "!";
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setPresence({
        activities: [{ name: '!meme @ .gg/Armour', type: ActivityType.Watching }],
        status: 'dnd'
    });
    client.commands = new Map();
    const commandFiles = fs.readdirSync(`${__dirname}/commands`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`${__dirname}/commands/${file}`);
        client.commands.set(command.name, command);
    }
    client.on('messageCreate', async (message) => {
        try {
            if (!message.content.startsWith(prefix) || message.author.bot) return;
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            if (!client.commands.has(commandName)) return;
            const command = client.commands.get(commandName);
            command.execute(message, args, client);
        } catch (error) {
            console.error(error);
            message.reply('There was an error executing the command.');
        }
    });
});

client.login(config.token);
