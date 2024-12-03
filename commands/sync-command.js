// Sincroniza los comandos de commands.json para borrar los comandos que no sirvan de el slashcommands.

const { SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

const commandsFilePath = path.join(__dirname, '../commands.json');
const commandsFolderPath = path.join(__dirname, '../commands');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sync-commands')
        .setDescription('Sincroniza los comandos en Discord con los definidos en el bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const rest = new REST({ version: '10' }).setToken(config.token);

        // Responder inmediatamente para evitar el timeout
        await interaction.reply({ content: 'Sincronizando los comandos, por favor espera...', ephemeral: true });

        // Cargar comandos dinámicos desde commands.json
        let commandsData = {};
        if (fs.existsSync(commandsFilePath)) {
            commandsData = JSON.parse(fs.readFileSync(commandsFilePath, 'utf8'));
        }

        // Cargar comandos estáticos desde la carpeta commands/
        const staticCommands = [];
        const commandFiles = fs.readdirSync(commandsFolderPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(path.join(commandsFolderPath, file));
            staticCommands.push(command.data.toJSON());
        }

        // Combinar comandos estáticos y dinámicos
        const commandsToRegister = [...staticCommands];
        for (const [commandName, commandInfo] of Object.entries(commandsData)) {
            commandsToRegister.push({
                name: commandName,
                description: 'Comando generado dinámicamente.',
            });
        }

        try {
            // Obtener todos los comandos actualmente registrados en Discord
            console.log('Obteniendo los comandos registrados en Discord...');
            const currentCommands = await rest.get(
                Routes.applicationGuildCommands(config.clientId, config.guildId)
            );

            // Nombres de comandos estáticos y dinámicos
            const registeredCommandNames = commandsToRegister.map(cmd => cmd.name);

            // Identificar comandos para eliminar
            const commandsToDelete = currentCommands.filter(cmd => !registeredCommandNames.includes(cmd.name));

            // Eliminar comandos obsoletos
            for (const command of commandsToDelete) {
                console.log(`Eliminando comando obsoleto: /${command.name}`);
                await rest.delete(
                    Routes.applicationGuildCommand(config.clientId, config.guildId, command.id)
                );
            }

            // Registrar nuevos comandos
            console.log('Actualizando comandos en Discord...');
            await rest.put(
                Routes.applicationGuildCommands(config.clientId, config.guildId),
                { body: commandsToRegister }
            );

            console.log('Sincronización completa.');
        } catch (error) {
            console.error('Error al sincronizar los comandos:', error);
            // Actualizar el mensaje inicial con el error si ocurre
            await interaction.editReply({ content: 'Hubo un error al sincronizar los comandos. Revisa los logs.' });
            return;
        }

        // Actualizar el mensaje inicial con el éxito de la operación
        await interaction.editReply({ content: '¡Los comandos han sido sincronizados correctamente!' });
    },
};
