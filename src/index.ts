require("dotenv").config();
import { Client, Intents, Interaction, Message } from "discord.js";
import { Datastore } from "@google-cloud/datastore";

const datastoreClient = new Datastore({ keyFilename: process.env.IAM_KEY_FILE })
// const permissionsString = process.env.DISCORD_PERMISSIONS_INTEGER;
// let discordBitPermissions;

// if(permissionsString !== undefined){
//   discordBitPermissions = parseInt(permissionsString);
// } else {
//   throw Error("DISCORD_PERMISSIONS_INTEGER not specified in .env, terminating!");
// }

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

client.once("ready", () => {
  console.log("client intialised!!");
})

client.on("messageCreate", async (message: Message) => {
  // do a test activation phrase
  if(!message.content.includes("hey test bot")){
    return;
  }
  console.log(message.content, message.createdAt, message.author.username);
  // TODO: make this work with the datastore api
  datastoreClient.collection("messages").add({
    content: message.content,
    createdAt: message.createdAt,
    senderUsername: message.author.username,
    senderId: message.author.id
  })
})

client.on("interactionCreate", async (interaction: Interaction) => {
  console.log(interaction.type, interaction.user.username,);
})

client.login(process.env.DISCORD_BOT_TOKEN);