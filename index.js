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
  AudioPlayerStatus 
} = require("@discordjs/voice");

const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");

require("dotenv").config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once("ready", async () => {
  console.log(`Connecté en tant que ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("play")
      .setDescription("Joue une musique depuis YouTube")
      .addStringOption(option =>
        option
          .setName("musique")
          .setDescription("Nom ou lien YouTube")
          .setRequired(true)
      )
      .toJSON()
  ];

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
  );

  console.log("Commande /play enregistrée");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "play") {
    const query = interaction.options.getString("musique");

    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: "Tu dois être dans un salon vocal.",
        ephemeral: true
      });
    }

    await interaction.deferReply();

    let video;

    if (ytdl.validateURL(query)) {
      video = { url: query };
    } else {
      const result = await ytSearch(query);
      video = result.videos[0];
    }

    if (!video) {
      return interaction.editReply("Musique introuvable.");
    }

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator
    });

    const stream = ytdl(video.url, {
      filter: "audioonly",
      quality: "highestaudio"
    });

    const resource = createAudioResource(stream);
    const player = createAudioPlayer();

    connection.subscribe(player);
    player.play(resource);

    const embed = new EmbedBuilder()
      .setColor("#8A0303")
      .setTitle("🎵 Lecture en cours")
      .setDescription(`**${video.title}**`)
      .setThumbnail(video.thumbnail || null)
      .setFooter({ text: "EntityObsi Music" });

    interaction.editReply({ embeds: [embed] });
  }
});

client.login(TOKEN);
