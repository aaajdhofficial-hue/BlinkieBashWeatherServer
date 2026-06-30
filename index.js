const express = require('express');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const app = express();
app.use(express.json());

let currentWeather = {
    type: 'None',
    rooms: 'all',
    timestamp: Date.now(),
    duration: 30
};

let adminList = [];

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds
    ] 
});

const weatherEmojis = {
    'None': '☀️',
    'Wet': '🌧️',
    'HeatWave': '🔥',
    'Frost': '❄️',
    'Moonmade': '🌙',
    'Radioactive': '☢️'
};

const weatherColors = {
    'None': 0xFFFFFF,
    'Wet': 0x3498DB,
    'HeatWave': 0xFF6B00,
    'Frost': 0x00FFFF,
    'Moonmade': 0x9B59B6,
    'Radioactive': 0x00FF00
};

const ALLOWED_ROLE_ID = '1516540618292330577';

async function registerCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName('weather')
            .setDescription('Trigger a weather event in Blinkies Bash')
            .addStringOption(option =>
                option.setName('type')
                    .setDescription('Weather type')
                    .setRequired(true)
                    .addChoices(
                        { name: 'None (Clear)', value: 'None' },
                        { name: 'Wet', value: 'Wet' },
                        { name: 'Heat Wave', value: 'HeatWave' },
                        { name: 'Frost', value: 'Frost' },
                        { name: 'Moonmade', value: 'Moonmade' },
                        { name: 'Radioactive', value: 'Radioactive' }
                    ))
            .addIntegerOption(option =>
                option.setName('duration')
                    .setDescription('How long the event lasts in minutes (default: 30)')
                    .setRequired(false)
                    .setMinValue(1)
                    .setMaxValue(120))
            .addStringOption(option =>
                option.setName('rooms')
                    .setDescription('Which rooms to affect')
                    .setRequired(false)
                    .addChoices(
                        { name: 'All Rooms', value: 'all' },
                        { name: 'Specific Room', value: 'specific' }
                    ))
            .addStringOption(option =>
                option.setName('roomname')
                    .setDescription('Room name (only if specific room selected)')
                    .setRequired(false)),

        new SlashCommandBuilder()
            .setName('grantadmin')
            .setDescription('Grant admin access to a player in Blinkies Bash')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Exact in-game name of the player')
                    .setRequired(true)),

        new SlashCommandBuilder()
            .setName('revokeadmin')
            .setDescription('Revoke admin access from a player')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Exact in-game name of the player')
                    .setRequired(true)),

        new SlashCommandBuilder()
            .setName('adminlist')
            .setDescription('Show current list of admins')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('Slash commands registered!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const member = interaction.member;
    if (!member.roles.cache.has(ALLOWED_ROLE_ID)) {
        await interaction.reply({ 
            content: '❌ You do not have permission to use this command!', 
            ephemeral: true 
        });
        return;
    }

    if (interaction.commandName === 'weather') {
        const weatherType = interaction.options.getString('type');
        const duration = interaction.options.getInteger('duration') || 30;
        const rooms = interaction.options.getString('rooms') || 'all';
        const roomName = interaction.options.getString('roomname') || '';

        currentWeather = {
            type: weatherType,
            rooms: rooms === 'all' ? 'all' : roomName,
            timestamp: Date.now(),
            duration: duration
        };

        const endTime = Math.floor((Date.now() + (duration * 60 * 1000)) / 1000);

        const embed = new EmbedBuilder()
            .setColor(weatherColors[weatherType] || 0xFFFFFF)
            .setTitle(`${weatherEmojis[weatherType] || '🌤'} Weather Event Started`)
            .addFields(
                { name: 'Weather', value: `**${weatherType}** is now active!`, inline: false },
                { name: 'Duration', value: `${duration} minutes`, inline: true },
                { name: 'Ends At', value: `<t:${endTime}:R>`, inline: true },
                { name: 'Rooms', value: rooms === 'all' ? 'All Rooms' : roomName, inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        console.log(`Weather set: ${weatherType} for ${rooms === 'all' ? 'all rooms' : roomName} for ${duration} minutes`);
    }

    else if (interaction.commandName === 'grantadmin') {
        const name = interaction.options.getString('name');
        if (!adminList.includes(name)) {
            adminList.push(name);
        }
        await interaction.reply(`✅ Granted admin access to **${name}**`);
        console.log(`Admin granted to: ${name}`);
    }

    else if (interaction.commandName === 'revokeadmin') {
        const name = interaction.options.getString('name');
        adminList = adminList.filter(n => n !== name);
        await interaction.reply(`🚫 Revoked admin access from **${name}**`);
        console.log(`Admin revoked from: ${name}`);
    }

    else if (interaction.commandName === 'adminlist') {
        const list = adminList.length > 0 ? adminList.join(', ') : 'No admins currently';
        await interaction.reply(`👑 Current admins: ${list}`);
    }
});

app.get('/weather', (req, res) => {
    res.json(currentWeather);
});

app.get('/admins', (req, res) => {
    res.json({ admins: adminList });
});

app.get('/', (req, res) => {
    res.send('Blinkies Bash Weather Server is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

client.once('ready', async () => {
    console.log(`Discord bot logged in as ${client.user.tag}`);
    await registerCommands();
});

client.login(process.env.DISCORD_TOKEN);
