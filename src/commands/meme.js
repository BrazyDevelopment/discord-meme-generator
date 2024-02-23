const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const config = require('../config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
});

let clientInstance;
function setClient(client) {
    clientInstance = client;
}

async function generateMeme(templateIdOrUrl, ...texts) {
    try {
        let url;
            const sanitizedTexts = texts.map(text => encodeURIComponent(text.replace(/ /g, '_')));
            url = `https://api.memegen.link/images/${templateIdOrUrl}/${sanitizedTexts.join('/')}.png`;
            return url;
    } catch (error) {
        console.error('Error generating meme:', error);
        return;
    }
}

async function fetchTemplates() {
    try {
        const templates = await axios.get("https://api.memegen.link/templates/");
        return templates.data;
    } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
    }
}

async function askQuestion(message, question, options) {
    try {
        await message.reply(`${message.author} ${question}`);
        const filter = response => {
            return options ? options.includes(response.content.trim().toLowerCase()) : true;
        };
        const collected = await message.channel.awaitMessages({
            filter,
            max: 1,
            time: config.updateInterval,
            errors: ['time']
        });
        if (collected.size === 0) {
            await message.reply(`${message.author} No response received. Cancelling operation.`);
        }
        const response = collected.first().content.trim().toLowerCase();
        return response;
    } catch (error) {
        console.error('Error asking question:', error.message);
        return;
    }
}

async function askTemplate(message) {
    const templates = await fetchTemplates();
    if (!templates) return;

    const templateNames = templates.map(t => t.name.toLowerCase());

    const templateName = await askQuestion(message, "Which template would you like to use? Copy and paste a meme name from our official [meme search page](https://memes.armour.dev/search)!", templateNames);
    if (templateName === undefined || templateName === '') {
        await message.reply(`${message.author} No template provided within \`1 minute\`. Cancelling operation.`);
        console.log('Cancelling operation due to timeout.')
        return;
    }

    const template = templates.find(t => t.name.toLowerCase() === templateName.toLowerCase());
    if (template) {
        return template.id;
    } else {
        await message.reply(`${message.author} Template not found. Please try another template.`);
        return;
    }
}




async function askTexts(message, templateId) {
    if (!templateId) {
        return [];
    }

    const texts = [];

    // Ask for the first line of text
    const firstLine = await askQuestion(message, `Enter the first line of text (or type **\`skip\`** to skip):`);
    if (firstLine === 'skip') {
        return texts; // If 'skip' is entered, return empty array
    }
    texts.push(firstLine);

    // Ask for the second line of text
    const secondLine = await askQuestion(message, `Enter the second line of text (or type **\`finish\`** to finish):`);
    if (secondLine === 'finish') {
        return texts; // If 'finish' is entered, return texts with only the first line
    }
    texts.push(secondLine);

    return texts;
}


const prefix = "!";

module.exports = {
    name: 'meme',
    description: 'Generate a meme',
    setClient,

    async execute(message) {
        if (message.author.bot) return;
    
        if (message.content.startsWith(prefix + 'meme')) {
            console.log("meme triggered");
            const templateId = await askTemplate(message);
            
            if (templateId === null) {
                return;
            }
    
            const texts = await askTexts(message, templateId);
            if (!texts || texts.length === 0) {
                return;
            }
    
            // Generate meme URL
            const memeUrl = await generateMeme(templateId, ...texts);
    
            if (memeUrl) {
                const disguisedLink = `[View Your Meme](${memeUrl})`;
                message.reply(`${message.author} ${disguisedLink}`);
            } else {
                message.reply(`${message.author} Failed to generate meme. Please try again.\n\nIf the problem persists, report it here: https://discord.gg/armour`);
            }
        }
    }
}    


