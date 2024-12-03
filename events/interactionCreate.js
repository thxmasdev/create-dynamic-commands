// Maneja la ejecuccion de comandos cuando los usuarios los utilizan en discord.

const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const commandsFilePath = path.join(__dirname, '../commands.json');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (command) {
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error al ejecutar el comando ${interaction.commandName}:`, error);
                await interaction.reply({ content: 'Hubo un error al ejecutar este comando.', ephemeral: true });
            }
            return;
        }

        let commandsData = {};
        if (fs.existsSync(commandsFilePath)) {
            commandsData = JSON.parse(fs.readFileSync(commandsFilePath, 'utf8'));
        }

        const commandData = commandsData[interaction.commandName];
        if (commandData) {
            const embed = new EmbedBuilder()
                .setTitle(commandData.titulo)
                .setDescription(commandData.descripcion)
                .setColor(0x00AEFF);

            if (commandData.footer) embed.setFooter({ text: commandData.footer });
            if (commandData.image) embed.setImage(commandData.image);

            return await interaction.reply({ embeds: [embed] });
        }

        await interaction.reply({ content: 'Comando no encontrado o no registrado.', ephemeral: true });
    },
};
