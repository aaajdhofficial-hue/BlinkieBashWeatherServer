const express = require('express');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const app = express();
app.use(express.json());

// Store the current weather event
let currentWeather = {
    type: 'None',
    rooms: 'all',
    timestamp: Date.now()
};

const SECRET_KEY = 'blinkiebash2024';

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ] 
});

const weatherTypes = ['None', 'Wet', 'HeatWave', 'Frost', 'Moonmade', 'Radioactive'];

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

    // Replace with your allowed role ID
    const ALLOWED_ROLE_ID = 'YOUR_ROLE_ID_HERE';

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

    await interaction.reply(`🌤 Weather event set to **${weatherType}** for **${rooms === 'all' ? 'ALL rooms' : roomName}**!`);
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
