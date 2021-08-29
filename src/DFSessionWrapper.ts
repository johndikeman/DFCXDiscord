import { Datastore } from "@google-cloud/datastore";
import { DateTime } from "luxon";
import superchargeStrings from "@supercharge/strings";
import { MessageActionRow, MessageActionRowOptions, User } from "discord.js";
import { SessionsClient} from "@google-cloud/dialogflow-cx";

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

interface ResponseObject {
  text: string,
  // this needs to be the discord component format but types are hard
  payload: any[]
}

export class DFSessionWrapper {
  // storing the timestamp of the last message
  public lastMessageTime: DateTime | undefined = undefined;
  // the datastoreClient we'll use
  private _datastoreClient: Datastore;
  private _sessionId: string;
  private _sessionData: SessionEntity;
  private _sessionString: string;
  private _dfClient: SessionsClient

  /**
   * a wrapper object representing a Dialogflow session.
   * @param datastoreClient the Datastore client object to use
   * @param author the User object the session is with
   * @param dfClient the Dialogflow client object to use
   */
  constructor(datastoreClient: Datastore, author: User, dfClient: SessionsClient){
    this._sessionData = {
      createdAt: new Date(), // this should make it the actual datetime datatype in the datastore console
      authorId: author.id,
      authorName: author.username,
      lastPage: "" // not on a page yet
    };
    this._dfClient = dfClient;
    this._sessionString = "";
    this._datastoreClient = datastoreClient;
    // the sessionId we can pass to dialogflow and hopefully use as the datastore key
    // I think technically this could cause collision issues because I'm not specifically
    // preventing it but it wouldn't be that hard. future john's problem
    this._sessionId = superchargeStrings.random();
    // this._sessionId = "testsessiondon't@me";
    // this is where we initialise the DF session I think
    if(process.env.GCLOUD_PROJECT === undefined || process.env.DF_AGENT_LOCATION === undefined || process.env.DF_AGENT_ID === undefined){
      new Error("Couldn't initialize the DialogFlow session, please provide GCLOUD_PROJECT, DF_AGENT_LOCATION, and DF_AGENT_ID environment variables")
    } else {
      this._sessionString= dfClient.projectLocationAgentSessionPath(
        process.env.GCLOUD_PROJECT,
        process.env.DF_AGENT_LOCATION,
        process.env.DF_AGENT_ID,
        this._sessionId)
      }
      // write the session so far to the db
    this.writeSessionToDatastore();
  }

  async getResponse(utterance: string): Promise<ResponseObject>{
    // need to check lastMessageTime and take the absolute value of the time because it'll be negative
    const timeAfterLastMessage = this.lastMessageTime ? Math.abs(this.lastMessageTime.diffNow(["seconds"]).seconds) : undefined;
    // TODO: also set the last pageid here with the DF response
    if(timeAfterLastMessage !== undefined && timeAfterLastMessage <  SECONDS_BETWEEN_MESSAGES){
      return {text: "sorry, I can't keep up! wait a second and try again.", payload: []};
    } else {
      this.lastMessageTime = DateTime.now();
      this.writeMessageToDatastore(utterance);

      const dfReq = {
        session: this._sessionString,
        queryInput: {
          text: {
            text: utterance
          },
          languageCode: "en"
        },
        queryParams: {
          parameters: {   
            fields: {
              "authorName": {stringValue: this._sessionData.authorName},
              "authorId": {stringValue: this._sessionData.authorId}
            }
          }
        }
      }

      // TODO: when we get the pageId back from Df, just set this.sessionData and change writeSessionToDatastore to upsert and call it again :)
      const [res] = await this._dfClient.detectIntent(dfReq);
      const returnObject: ResponseObject = {
        text: "",
        payload: []
      }

      const responseMessages = res.queryResult?.responseMessages;
      if(responseMessages !== null && responseMessages !== undefined){
        // go through the response objects in the array
        for(const response of responseMessages){
          // if the response just has text
          if(response.text){
            // concatenate the return object with the text we get back
            returnObject.text += response.text?.text?.join(" ");
          } else if(response.payload){
            returnObject.payload?.push(response.payload);
          }
        } 
      }
      return returnObject;
    }
  }

  
  private writeMessageToDatastore(utterance: string) {
    const messageData: MessageEntity = {
      createdAt: new Date(),
      sessionId: this._sessionId,
      content: utterance,
    };

    this._datastoreClient.insert({
      key: this._datastoreClient.key(["Message"]),
      data: messageData
    });
  }

  private async writeSessionToDatastore() {
    const sessionKey = this._datastoreClient.key(["Session", this._sessionId]);
    this._datastoreClient.insert({
      key: sessionKey,
      data: this._sessionData
    })
  }
}
