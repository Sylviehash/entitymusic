
Conversation ouverte. 1 message non lu.

Aller au contenu
Utiliser Gmail avec un lecteur d'écran
1 sur 43
(aucun objet)
Boîte de réception
Sylvie Gaming <viviannechainel57@gmail.com>
	
02:30 (il y a 1 minute)
	
	
À moi
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
AudioPlayerStatus,
getVoiceConnection
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

let player = createAudioPlayer();

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
),

new SlashCommandBuilder()
.setName("leave")
.setDescription("Fait quitter le bot du vocal")
].map(cmd => cmd.toJSON());

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
if (connection) {
connection.destroy();
return interaction.reply("Je quitte le salon vocal.");
} else {
return interaction.reply("Je ne suis pas connecté.");
}
}

if (interaction.commandName === "play") {
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
]
});

try {
let url;
let title;
let thumbnail;

if (play.yt_validate(query) === "video") {
const info = await play.video_info(query);
url = query;
title = info.video_details.title;
thumbnail = info.video_details.thumbnails?.pop()?.url;
} else {
const results = await play.search(query, { limit: 1 });
if (!results.length)
return interaction.editReply("❌ Aucun résultat trouvé.");
url = results[0].url;
title = results[0].title;
thumbnail = results[0].thumbnails?.pop()?.url;
}

let connection = getVoiceConnection(interaction.guild.id);

if (!connection) {
connection = joinVoiceChannel({
channelId: voiceChannel.id,
guildId: interaction.guild.id,
adapterCreator: interaction.guild.voiceAdapterCreator,
selfDeaf: false
});
}

const stream = await play.stream(url, {
discordPlayerCompatibility: true
});

const resource = createAudioResource(stream.stream, {
inputType: stream.type,
inlineVolume: true
});

player.play(resource);
connection.subscribe(player);

const embed = new EmbedBuilder()
.setColor("#8A0303")
.setTitle("🎶 Lecture en cours")
.setDescription(`**${title}**`)
.setThumbnail(thumbnail)
.setFooter({
text: "EntityObsi vous souhaite une écoute agréable."
});

await interaction.editReply({ embeds: [embed] });

} catch (err) {
console.error("PLAY ERROR:", err);
return interaction.editReply("❌ Erreur pendant la lecture.");
}
}
});

player.on(AudioPlayerStatus.Idle, () => {
console.log("Musique terminée. Bot reste connecté.");
});

player.on("error", error => {
console.error("Audio error:", error);
});

client.login(TOKEN);
