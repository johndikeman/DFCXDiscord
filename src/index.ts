require("dotenv").config();
import { Client, Intents, Interaction, Message } from "discord.js";

// const permissionsString = process.env.DISCORD_PERMISSIONS_INTEGER;
// let discordBitPermissions;

// if(permissionsString !== undefined){
//   discordBitPermissions = parseInt(permissionsString);
// } else {
//   throw Error("DISCORD_PERMISSIONS_INTEGER not specified in .env, terminating!");
// }

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

client.once("ready", () => {
  console.log("client intialised!!");
})

client.on("messageCreate", async (message: Message) => {
  console.log(message.content, message.createdAt, message.author.username);
})

// client.on("interactionCreate", async (interaction: Interaction) => {
//   console.log(interaction.type, interaction.user.username,);
// })

client.login(process.env.DISCORD_BOT_TOKEN);