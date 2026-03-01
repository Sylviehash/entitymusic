require("dotenv").config();

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { 
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
} = require("@discordjs/voice");

const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("!play")) return;

  const args = message.content.split(" ").slice(1);
  if (!args.length) return message.reply("🎵 Donne un nom de musique.");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.reply("❌ Tu dois être dans un salon vocal.");

  const search = await ytSearch(args.join(" "));
  if (!search.videos.length) return message.reply("❌ Aucun résultat trouvé.");

  const video = search.videos[0];

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: message.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator
  });

  const stream = ytdl(video.url, {
    filter: "audioonly",
    quality: "highestaudio",
    highWaterMark: 1 << 25
  });

  const resource = createAudioResource(stream);
  const player = createAudioPlayer();

  connection.subscribe(player);
  player.play(resource);

  const embed = new EmbedBuilder()
    .setColor("#8A0303")
    .setTitle("🎶 Lecture en cours")
    .setDescription(`**${video.title}**`)
    .addFields({
      name: "Message",
      value: "Entityobsi vous souhaites une écoute agréable, profitez de cet instant de détente 😀"
    })
    .setThumbnail(video.thumbnail)
    .setFooter({ text: "EntityObsi Music" });

  message.channel.send({ embeds: [embed] });

  player.on(AudioPlayerStatus.Idle, () => {
    connection.destroy();
  });
});

client.login(process.env.TOKEN);
