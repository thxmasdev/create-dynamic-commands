// Crea comandos y los datos los almacena en el commands.json para requerirlos luego para ejecutarlos "solamente embeds".


const { SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

const commandsFilePath = path.join(__dirname, '../commands.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-command')
        .setDescription('Crea un nuevo comando que genera un embed dinámico y lo registra automáticamente.')
        .addStringOption(option =>
            option.setName('titulo')
                .setDescription('Título del embed')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('descripcion')
                .setDescription('Descripción del embed (usa "ª" para saltos de línea)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('slashcommand')
                .setDescription('El nombre del slash command a crear')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('footer')
                .setDescription('Texto opcional del footer'))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('URL opcional de la imagen'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const titulo = interaction.options.getString('titulo');
        let descripcion = interaction.options.getString('descripcion');
        const slashCommand = interaction.options.getString('slashcommand').toLowerCase();
        const footer = interaction.options.getString('footer') || '';
        const image = interaction.options.getString('image') || '';

        descripcion = descripcion.replace(/ª/g, '\n');

        let commandsData = {};
        if (fs.existsSync(commandsFilePath)) {
            commandsData = JSON.parse(fs.readFileSync(commandsFilePath, 'utf8'));
        }

        if (commandsData[slashCommand]) {
            return interaction.reply({ content: `El comando /${slashCommand} ya existe. Usa otro nombre.`, ephemeral: true });
        }

        commandsData[slashCommand] = { titulo, descripcion, footer, image };
        fs.writeFileSync(commandsFilePath, JSON.stringify(commandsData, null, 2));

        await interaction.reply({ content: `Comando /${slashCommand} creado correctamente. Actualizando comandos...`, ephemeral: true });

        const rest = new REST({ version: '10' }).setToken(config.token);
        const commands = [];

        for (const [commandName, commandInfo] of Object.entries(commandsData)) {
            commands.push({
                name: commandName,
                description: 'Comando generado dinámicamente.',
            });
        }

        try {
            console.log('Intentando registrar los comandos en Discord...');
            await rest.put(
                Routes.applicationGuildCommands(config.clientId, config.guildId),
                { body: commands }
            );
            console.log(`Comando /${slashCommand} registrado correctamente en Discord.`);
        } catch (error) {
            console.error('Error al registrar los comandos:', error);
        }
    },
};
