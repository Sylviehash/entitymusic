const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  AudioPlayerStatus
} = require("@discordjs/voice");

const play = require("play-dl");
require("dotenv").config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN) {
  console.error("TOKEN manquant.");
  process.exit(1);
}

if (!CLIENT_ID) {
  console.error("CLIENT_ID manquant.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

const player = createAudioPlayer();

client.once("ready", async () => {
  console.log(`Connecté en tant que ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("play")
      .setDescription("Joue une musique YouTube")
      .addStringOption(option =>
        option.setName("musique")
          .setDescription("Nom ou lien")
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName("leave")
      .setDescription("Fait quitter le bot du vocal")
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
  );

  console.log("Commandes enregistrées");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "leave") {
    const connection = getVoiceConnection(interaction.guild.id);
    if (connection) connection.destroy();
    return interaction.reply("Je quitte le salon vocal.");
  }

  if (interaction.commandName === "play") {
    const query = interaction.options.getString("musique");
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel)
      return interaction.reply({
        content: "Tu dois être dans un vocal.",
        ephemeral: true
      });

    await interaction.reply("Recherche en cours...");

    try {
      const results = await play.search(query, { limit: 1 });
      if (!results.length)
        return interaction.editReply("Aucun résultat.");

      const url = results[0].url;

      let connection = getVoiceConnection(interaction.guild.id);
      if (!connection) {
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
          selfDeaf: false
        });
      }

      const stream = await play.stream(url);

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true
      });

      player.play(resource);
      connection.subscribe(player);

      const embed = new EmbedBuilder()
        .setColor("#8A0303")
        .setTitle("Lecture en cours")
        .setDescription(results[0].title)
        .setThumbnail(results[0].thumbnails[0]?.url);

      await interaction.editReply({ content: "", embeds: [embed] });

    } catch (err) {
      console.error("Erreur lecture:", err);
      return interaction.editReply("Erreur pendant la lecture.");
    }
  }
});

player.on(AudioPlayerStatus.Idle, () => {
  console.log("Musique terminée (reste connecté)");
});

client.login(TOKEN);
