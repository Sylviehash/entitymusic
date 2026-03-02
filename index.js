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

const play = require("play-dl");
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
if (interaction.commandName !== "play") return;

const query = interaction.options.getString("musique");
const voiceChannel = interaction.member.voice.channel;

if (!voiceChannel) {
return interaction.reply({
content: "Tu dois être dans un salon vocal.",
ephemeral: true
});
}

await interaction.reply({
embeds: [
new EmbedBuilder()
.setColor("#8A0303")
.setTitle("🎵 EntityMusic")
.setDescription(`🔎 Recherche : **${query}**`)
.setFooter({
text: "EntityObsi vous souhaite une écoute agréable."
})
]
});

try {
let url;
let title = "Musique";
let thumbnail = null;

if (play.yt_validate(query) === "video") {
url = query;
const info = await play.video_info(url);
title = info.video_details.title;
thumbnail = info.video_details.thumbnails?.pop()?.url;
} else {
const results = await play.search(query, { limit: 1 });
if (!results.length) {
return interaction.editReply("❌ Aucun résultat trouvé.");
}
url = results[0].url;
title = results[0].title;
thumbnail = results[0].thumbnails?.pop()?.url;
}

const connection = joinVoiceChannel({
channelId: voiceChannel.id,
guildId: interaction.guild.id,
adapterCreator: interaction.guild.voiceAdapterCreator,
selfDeaf: false
});

const stream = await play.stream(url);

const resource = createAudioResource(stream.stream, {
inputType: stream.type
});

const player = createAudioPlayer();
connection.subscribe(player);
player.play(resource);

const embed = new EmbedBuilder()
.setColor("#8A0303")
.setTitle("🎶 Lecture en cours")
.setDescription(`**${title}**`)
.setThumbnail(thumbnail)
.setFooter({
text: "EntityObsi Music"
});

await interaction.editReply({ embeds: [embed] });

player.on(AudioPlayerStatus.Idle, () => {
connection.destroy();
});

player.on("error", err => {
console.error("Audio Error:", err);
connection.destroy();
});

} catch (err) {
console.error("PLAY ERROR:", err);
return interaction.editReply("❌ Erreur pendant la lecture.");
}
});

client.login(TOKEN);

