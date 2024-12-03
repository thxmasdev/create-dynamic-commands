// Registra los comandos (estaticos y los dinamicos) los normales y los creados en commands.json

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

const commandsFilePath = path.join(__dirname, '../commands.json');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`¡Bot iniciado como ${client.user.tag}!`);

        const rest = new REST({ version: '10' }).setToken(config.token);

        const commands = [];

        const commandsFolderPath = path.join(__dirname, '../commands');
        const commandFiles = fs.readdirSync(commandsFolderPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(path.join(commandsFolderPath, file));
            commands.push(command.data.toJSON());
        }

        if (fs.existsSync(commandsFilePath)) {
            const commandsData = JSON.parse(fs.readFileSync(commandsFilePath, 'utf8'));
            for (const [commandName, commandInfo] of Object.entries(commandsData)) {
                commands.push({
                    name: commandName,
                    description: 'Comando generado dinámicamente.',
                });
            }
        }

        try {
            console.log('Actualizando los comandos de aplicación...');
            await rest.put(
                Routes.applicationGuildCommands(config.clientId, config.guildId),
                { body: commands }
            );
            console.log('¡Comandos registrados correctamente!');
        } catch (error) {
            console.error('Error al registrar comandos al iniciar el bot:', error);
        }
    },
};
