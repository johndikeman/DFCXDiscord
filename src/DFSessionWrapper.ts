import { Datastore } from "@google-cloud/datastore";
import { DateTime } from "luxon";
import superchargeStrings from "@supercharge/strings";
import { User } from "discord.js";

const SECONDS_BETWEEN_MESSAGES = 2; 

interface SessionEntity {
  createdAt: Date; // this should make it the actual datetime datatype in the datastore console
  authorId: string;
  authorName: string; 
  lastPage: string; // not on a page yet
}

interface MessageEntity {
  createdAt: Date,
  sessionId: string,
  content: string,
}

export class DFSessionWrapper {
  // storing the timestamp of the last message
  public lastMessageTime: DateTime | undefined = undefined;
  // the datastoreClient we'll use
  private datastoreClient: Datastore;
  private sessionId: string;
  public sessionData: SessionEntity;

  constructor(datastoreClient: Datastore, author: User){
    this.sessionData = {
      createdAt: new Date(), // this should make it the actual datetime datatype in the datastore console
      authorId: author.id,
      authorName: author.username,
      lastPage: "" // not on a page yet
    };
    
    this.datastoreClient = datastoreClient;
    // the sessionId we can pass to dialogflow and hopefully use as the datastore key
    // I think technically this could cause collision issues because I'm not specifically
    // preventing it but it wouldn't be that hard. future john's problem
    this.sessionId = superchargeStrings.random();
    // this is where we initialise the DF session I think

    // write the session so far to the db
    this.writeSessionToDatastore();
  }

  async getResponse(utterance: string): Promise<string> {
    // need to check lastMessageTime and take the absolute value of the time because it'll be negative
    const timeAfterLastMessage = this.lastMessageTime ? Math.abs(this.lastMessageTime.diffNow(["seconds"]).seconds) : undefined;
    // TODO: also set the last pageid here with the DF response
    if(timeAfterLastMessage !== undefined && timeAfterLastMessage <  SECONDS_BETWEEN_MESSAGES){
      return "sorry, I can't keep up! wait a second and try again.";
    } else {
      const testReplyOptions = ["heya!", "OwO what's this", "sure dude"];
      this.lastMessageTime = DateTime.now();
      return testReplyOptions[Math.floor(Math.random() * testReplyOptions.length)];
    }
  }

  private async writeSessionToDatastore() {
    const sessionKey = this.datastoreClient.key(["Session", this.sessionId]);
    this.datastoreClient.insert({
      key: sessionKey,
      data: this.sessionData
    })
  }
}
