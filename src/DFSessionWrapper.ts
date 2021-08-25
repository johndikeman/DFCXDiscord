import { DateTime } from "luxon";

const MESSAGES_PER_SECOND = .1

export class DFSessionWrapper {
  // storing the timestamp of the last message
  public lastMessageTime: DateTime | undefined = undefined;

  async getResponse(utterance: string): Promise<string> {
    if(this.lastMessageTime && this.lastMessageTime.diffNow(["seconds"]).seconds < (1.0 / MESSAGES_PER_SECOND)){
      return "sorry, I can't keep up! wait a second and try again.";
    } else {
      const testReplyOptions = ["heya!", "OwO what's this", "sure dude"];
      this.lastMessageTime = DateTime.now();
      return testReplyOptions[Math.floor(Math.random() * testReplyOptions.length)];
    }
  }
}
