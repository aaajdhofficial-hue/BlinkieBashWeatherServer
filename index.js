const express = require('express');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const app = express();
app.use(express.json());

let currentWeather = {
    type: 'None',
    rooms: 'all',
    timestamp: Date.now()
};

const SECRET_KEY = 'blinkiebash2024';

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
                    .setRequired(false))
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
    if (interaction.commandName !== 'weather') return;

    const ALLOWED_ROLE_ID = '1516540618292330577';

    const member = interaction.member;
    if (!member.roles.cache.has(ALLOWED_ROLE_ID)) {
        await interaction.reply({ 
            content: '❌ You do not have permission to use this command!', 
            ephemeral: true 
        });
        return;
    }

    const weatherType = interaction.options.getString('type');
    const rooms = interaction.options.getString('rooms') || 'all';
    const roomName = interaction.options.getString('roomname') || '';

    currentWeather = {
        type: weatherType,
        rooms: rooms === 'all' ? 'all' : roomName,
        timestamp: Date.now()
    };

    const endTime = Math.floor((Date.now() + (30 * 60 * 1000)) / 1000);

    const embed = new EmbedBuilder()
        .setColor(weatherColors[weatherType] || 0xFFFFFF)
        .setTitle(`${weatherEmojis[weatherType] || '🌤'} Weather Event Started`)
        .addFields(
            { name: 'Weather', value: `**${weatherType}** is now active!`, inline: false },
            { name: 'Duration', value: '30 minutes', inline: true },
            { name: 'Ends At', value: `<t:${endTime}:R>`, inline: true },
            { name: 'Rooms', value: rooms === 'all' ? 'All Rooms' : roomName, inline: false }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    console.log(`Weather set: ${weatherType} for ${rooms === 'all' ? 'all rooms' : roomName}`);
});

app.get('/weather', (req, res) => {
    res.json(currentWeather);
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
