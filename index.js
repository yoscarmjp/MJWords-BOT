
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// El cliente de Discord con los intents necesarios
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const config = {
    logChannelId: process.env.LOG_CHANNEL_ID || null,
    exemptRoles: (process.env.EXEMPT_ROLES || '').split(',').filter(Boolean),
    warningDuration: 5000
};

const patterns = {
    ipv4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?::\d{1,5})?\b/,
    

    domains: /(?:(?:[\w-]+\.)?minecraft\.(?:net|com|org|io|gg|me|to|serv\.nu|server|play|srv|hub|pvp|craft|game|miner|zone)(?::\d{1,5})?)|(?:mc\.(?:hypixel\.net|mineplex\.com|cubecraft\.net|mc-central\.net|wynncraft\.com|cosmicpvp\.com|performium\.net|munchymc\.com|purpleprison\.org|gommehd\.net|minemen\.club|manacube\.com|rinaorc\.com|veltpvp\.com|arkhamnetwork\.org|grandtheftminecart\.net|zonecraft\.net|mineheroes\.net|mineland\.net|epicpvp\.com|mccentral\.org|cubeville\.org|shotbow\.net|minecade\.com|mcprison\.com|lemoncloud\.net|universocraft\.com|pika-network\.net)(?::\d{1,5})?)/i,
    
    serverPatterns: /(?:ip|server|sv|s|conectar a|conect to|join to|join|entrar a|entrar|jugar en|jugar|play on|play at|play)\s*(?::|es|a|en|on|at|in|=|->|=>|:=)?\s*([\w\.-]+(?::\d{1,5})?)/i
};

const blockedWords = [
    "juega en mi server", 
    "únete a mi servidor", 
    "nuevo servidor de minecraft",
    "ip del servidor",
    "server ip",
    "entra a mi sv",
    "join my minecraft",
    "conectate a",
    "conectarse a",
    "conectaos a",
    "join my server"
];

client.once('ready', () => {
    console.log(`✅ Bot listo como ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    try {
        if (message.author.bot) return;
        
        const isExempt = message.member && 
            config.exemptRoles.some(roleId => message.member.roles.cache.has(roleId));
        
        if (isExempt) return;
        
        const msgLower = message.content.toLowerCase();
        let containsBlockedContent = false;
        let matchedPattern = '';
        
        if (patterns.ipv4.test(message.content)) {
            containsBlockedContent = true;
            matchedPattern = 'IP de servidor detectada';
        }
        
        if (!containsBlockedContent && patterns.domains.test(message.content)) {
            containsBlockedContent = true;
            matchedPattern = 'Dominio de Minecraft detectado';
        }
        
        if (!containsBlockedContent) {
            for (const word of blockedWords) {
                if (msgLower.includes(word.toLowerCase())) {
                    containsBlockedContent = true;
                    matchedPattern = `Palabra bloqueada: "${word}"`;
                    break;
                }
            }
        }
        
        if (!containsBlockedContent) {
            const serverMatch = message.content.match(patterns.serverPatterns);
            if (serverMatch && serverMatch[1]) {
                containsBlockedContent = true;
                matchedPattern = `Posible IP/dominio: "${serverMatch[1]}"`;
            }
        }
        
        if (containsBlockedContent) {
            await message.delete();
            
            setTimeout(() => {
                warningMsg.delete().catch(err => console.error('Error al eliminar mensaje de advertencia:', err));
            }, config.warningDuration);
            
            if (config.logChannelId) {
                const logChannel = client.channels.cache.get(config.logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('⚠️ Detección de IP/Servidor')
                        .setDescription(`Mensaje eliminado de ${message.author}`)
                        .addFields(
                            { name: 'Canal', value: `<#${message.channel.id}>` },
                            { name: 'Usuario', value: `<@${message.author.id}> (${message.author.tag})` },
                            { name: 'Patrón detectado', value: matchedPattern },
                            { name: 'Contenido del mensaje', value: message.content.length > 1024 ? 
                                message.content.substring(0, 1021) + '...' : message.content }
                        )
                        .setTimestamp();
                    
                    logChannel.send({ embeds: [logEmbed] }).catch(err => {
                        console.error('Error al enviar mensaje de log:', err);
                    });
                }
            }
            
            console.log(`🛑 Mensaje eliminado de ${message.author.tag}: "${message.content}" - Patrón: ${matchedPattern}`);
        }
    } catch (error) {
        console.error('Error al procesar mensaje:', error);
    }
});

client.on('ready', () => {
    console.log(`
╔════════════════════════════════════════╗
║ 🛡️ Bloqueador de IPs de Minecraft      ║
║ ✅ Bot activo y protegiendo el servidor ║
╚════════════════════════════════════════╝
    `);
});

client.on('error', error => {
    console.error('Error del cliente de Discord:', error);
});

process.on('unhandledRejection', error => {
    console.error('Error no controlado:', error);
});

client.login(process.env.DISCORD_TOKEN);