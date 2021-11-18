import {
  Client,
  Intents,
  Interaction,
  Message,
  MessageActionRow,
  MessageComponentInteraction,
} from "discord.js";
import { Datastore } from "@google-cloud/datastore";
import { SessionsClient } from "@google-cloud/dialogflow-cx";
import SimpleMemCache from "./SimpleMemCache";
import { DFSessionWrapper } from "./DFSessionWrapper";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const secretsClient = new SecretManagerServiceClient();
const dialogflowClient = new SessionsClient({
  apiEndpoint: `${process.env.DF_AGENT_LOCATION}-dialogflow.googleapis.com`,
});
const datastoreClient = new Datastore();
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});
const sessionCache = new SimpleMemCache();

import { log } from "./loggingClient";

async function setupClients() {
  const [discord_token_version] = await secretsClient.accessSecretVersion({
    name: process.env.DISCORD_TOKEN_SECRET,
  });

  const discord_token = discord_token_version.payload?.data?.toString();
  if (discord_token === undefined) {
    throw new Error(
      "Uh-oh! Couldn't get your Discord token, do you have DISCORD_BOT_TOKEN in secrets manager?"
    );
  }

  await client.login(discord_token);
}

// const testComponent = {
//   "type": 1,
//   "components": [
//       {
//           "type": 2,
//           "label": "Click me!",
//           "style": 1,
//           "custom_id": "click_one"
//       }
//   ]
// }

client.once("ready", () => {
  log("client intialised!!");
});

client.on("messageCreate", async (message: Message) => {
  const { content, author, mentions } = message;
  // if the message doesn't have the activation phrase check if it's a reply to an existing message or has the bot tagged
  // TODO: separate these all out into their own variables to help debugging this
  const mentioned = mentions.repliedUser;
  const botUser = client.user;
  // ternary to guarantee it's not null
  const tagString = botUser ? botUser.id : "";

  // each of the trigger conditions
  const hasActivationPhrase = content.includes("hey test bot");
  const isReplyToBot = botUser ? mentioned?.equals(botUser) : false;
  const botIsTagged = content.includes(tagString);

  if (hasActivationPhrase || isReplyToBot || botIsTagged) {
    // first check if they have a session already. if they do and they're just being weird or malicious, prompt them to reply to a message to continue
    let userSession = sessionCache.get(author);
    if (!userSession) {
      // if they don't have a session, make a new one and add it to the cache
      // TODO: change this to the actual new Dialogflow session object, add error handling too, make it a promise
      userSession = new DFSessionWrapper(
        datastoreClient,
        author,
        dialogflowClient
      );
      sessionCache.add(author, userSession);
      log("new session created!");
    }

    // TODO: check if we're within the rate limit (done in sessionwrapper)
    // get the response from the session object
    const res = await userSession.getResponse(message.content);
    try {
      await message.reply({ content: res.text, components: res.payload });
    } catch (error) {
      log(error);
    }
  }
  log(`${message.createdAt}, ${message.content}, ${message.author.username}`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (interaction.isMessageComponent()) {
    const customId = (interaction as MessageComponentInteraction).customId;
    const author = interaction.user;
    let userSession = sessionCache.get(author);
    let mentions = interaction.message.mentions;
    // to respond to the interaction, the user needs to have a session and be the one the bot is talking to
    if (
      userSession &&
      "users" in mentions &&
      mentions.users.get(author.id) !== undefined
    ) {
      // TODO: check if we're within the rate limit (done in sessionwrapper)
      // get the response from the session object
      const res = await userSession.getResponse(customId);
      try {
        await interaction.reply({ content: res.text, components: res.payload });
      } catch (error) {
        log(error);
      }
    } else {
      // if they don't meet those requests, this should mean that there's no "interaction failed" message
      interaction.deferReply();
    }

    log(
      `type: ${interaction.type}, username: ${interaction.user.username}, customid: ${customId}`
    );
  }
});

setupClients();
