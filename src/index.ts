require("dotenv").config();
import { Client, Intents, Interaction, Message,} from "discord.js";
import { Datastore } from "@google-cloud/datastore";
import SimpleMemCache from "./ SimpleMemCache";
import { isConstructorDeclaration } from "typescript";

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

const mockDFSessionObject = {
  getResponse: async (utterance: string) => {
    const testReplyOptions = ["heya!", "OwO what's this", "sure dude"]
    return testReplyOptions[Math.floor(Math.random() * testReplyOptions.length)];
  }
}

client.once("ready", () => {
  console.log("client intialised!!");
})

client.on("messageCreate", async (message: Message) => {

  const {content, author, mentions} = message;
  // do a test activation phrase
  if(content.includes("hey test bot")){
    // first check if they have a session already. if they do and they're just being weird or malicious, prompt them to reply to a message to continue
    if(sessionCache.get(author)){
      await message.reply("hey! reply to this message to keep going 🤠");
    } else {
      // if they don't have a session, make a new one and add it to the cache
      // TODO: change this to the actual new Dialogflow session object, add error handling too
      let sesh = mockDFSessionObject;
      sessionCache.add(author, sesh);

      // get the response from the session object
      const res = await sesh.getResponse(message.content);
      await message.reply(res);
    }
  } else {
    // if the message doesn't have the activation phrase check if it's a reply to an existing message or has the bot tagged
    // TODO: separate these all out into their own variables to help debugging this
    const mentioned = mentions.repliedUser;
    const botUser = client.user;
    // ternary to guarantee it's not null
    const tagString = botUser ? botUser.id : "";

    if(botUser !== null && (mentioned?.equals(botUser) || content.includes(tagString))){
      // TODO: this is also where we will check if there's an existing session in our in-mem cache
      // (all we're trying to do is prevent unnecessary calls to the database)
      const sesh = sessionCache.get(author)
      if(sesh !== undefined){
        let res = await sesh.getResponse(content);
        await message.reply(res);
      } else {
        // if they don't have a session, make a new one and add it to the cache
        // TODO: change this to the actual new Dialogflow session object, add error handling too
        let sesh = mockDFSessionObject;
        sessionCache.add(author, sesh);

        // get the response from the session object
        const res = await sesh.getResponse(content);
        await message.reply(res);
      }
    }
    
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