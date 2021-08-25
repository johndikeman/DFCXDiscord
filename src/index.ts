require("dotenv").config();
import { Client, Intents, Interaction, Message,} from "discord.js";
import { Datastore } from "@google-cloud/datastore";
import SimpleMemCache from "./SimpleMemCache";
import { DateTime } from "luxon";
import { DFSessionWrapper } from "./DFSessionWrapper";

const datastoreClient = new Datastore({ keyFilename: process.env.IAM_KEY_FILE })
// const permissionsString = process.env.DISCORD_PERMISSIONS_INTEGER;
// let discordBitPermissions;

// if(permissionsString !== undefined){
//   discordBitPermissions = parseInt(permissionsString);
// } else {
//   throw Error("DISCORD_PERMISSIONS_INTEGER not specified in .env, terminating!");
// }

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
const sessionCache = new SimpleMemCache(0.1);

client.once("ready", () => {
  console.log("client intialised!!");
})

client.on("messageCreate", async (message: Message) => {

  const {content, author, mentions} = message;
  // if the message doesn't have the activation phrase check if it's a reply to an existing message or has the bot tagged
  // TODO: separate these all out into their own variables to help debugging this
  const mentioned = mentions.repliedUser;
  const botUser = client.user;
  // ternary to guarantee it's not null
  const tagString = botUser ? botUser.id : "";

  // each of the trigger conditions
  const hasActivationPhrase = content.includes("hey test bot")
  const isReplyToBot = botUser ? mentioned?.equals(botUser) : false;
  const botIsTagged = content.includes(tagString);

  if( hasActivationPhrase || isReplyToBot || botIsTagged ) {
    // first check if they have a session already. if they do and they're just being weird or malicious, prompt them to reply to a message to continue
    let userSession = sessionCache.get(author)
    if(!userSession){
      // if they don't have a session, make a new one and add it to the cache
      // TODO: change this to the actual new Dialogflow session object, add error handling too, make it a promise
      userSession = new DFSessionWrapper();
      sessionCache.add(author, userSession);
      console.log("new session created!");
    }
    
    // TODO: check if we're within the rate limit (done in sessionwrapper)
    // get the response from the session object
    const res = await userSession.getResponse(message.content);
    await message.reply(res);

  }
  console.log(message.content, message.createdAt, message.author.username);
  // TODO: make this work with the datastore api
  // datastoreClient.collection("messages").add({
  //   content: message.content,
  //   createdAt: message.createdAt,
  //   senderUsername: message.author.username,
  //   senderId: message.author.id
  // })
})

client.on("interactionCreate", async (interaction: Interaction) => {
  console.log(interaction.type, interaction.user.username,);
})

client.login(process.env.DISCORD_BOT_TOKEN);