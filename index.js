const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`🔴 EntityMusic connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === "!entity") {

    const embed = new EmbedBuilder()
      .setColor("#8A0303")
      .setTitle("👁️ L'Entité vous observe")
      .setDescription(
        "Bienvenue dans l'ombre.\n\n" +
        "EntityObsi ressent ta présence.\n" +
        "Oses-tu défier ce qui te dépasse ?"
      )
      .setFooter({ text: "Obsidian World • EntityObsi" });

    message.channel.send({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
