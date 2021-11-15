DFCXDiscord
=
A Dialogflow CX integration with Discord. Write conversational experiences for your Discord server!

Features
-
- Tag or reply to your bot in a server to start a conversation, just like a real user
- Sessions and messages with your bot are stored in Firestore (in Datastore mode) for analytics and debugging
- Support for passing user variables to the Dialogflow session -- currently the username (`authorName`) and ID (`authorID`) of the Discord user engaging with the bot
- Support for Discord interactive components through custom payloads that conform to the [Discord Message Component](https://discord.com/developers/docs/interactions/message-components) format. The `custom_id` field in the selectable items is passed back to the session as an utterance when it's selected, you can capture it with a custom entity.

Installation
--

1. `git clone` and `npm install` to get the dependencies.

2. The integration expects a few values to be provided in a .env file:

`DISCORD_BOT_TOKEN`: The token for the Discord bot you want to use the integration for. (If you'd like instructions for setting up the Discord bot itself, getting the token, and adding it to a server, follow steps 2-4 of [these](https://www.digitaltrends.com/gaming/how-to-make-a-discord-bot/) instructions)

`GCLOUD_PROJECT`: The name of the GCP project containing your Dialogflow agent and Datastore instance.

`IAM_KEY_FILE`: The path to the IAM keyfile for your GCP project.

`DF_AGENT_ID`: The ID of the Dialogflow agent you want to connect.

`DF_AGENT_LOCATION`: The string location you selected for the agent when you created it (us-central1, us-west, etc)

3. `npm start` will compile and start. Once your Discord bot is created and added to a server, you should see it come online!

