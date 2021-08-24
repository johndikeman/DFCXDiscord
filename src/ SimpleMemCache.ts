import { User } from "discord.js";

interface TestDFSession {
  getResponse: (utterance: string) => Promise<string>
}

export default class SimpleMemCache {
  private _map: Map<string, TestDFSession>
  private _evictionTimeMs: number

  /**
   * a simple memcache for storing Dialogflow session objects to save latency & money probably
   * @param evictionTime the amount of time (in minutes) before an entry is evicted from the cache. defaults to 30 as this is Dialogflow CX's behavior.
   */
  constructor(evictionTime: number = 30) {
    this._map = new Map<string, TestDFSession>(); 
    this._evictionTimeMs = Math.floor(evictionTime * 60 * 1000);
  }

  public add(discordUser: User, dialogflowSessionObject: TestDFSession) {
    this._map.set(discordUser.id, dialogflowSessionObject);

    // queue up the deletion event
    setTimeout(() => {
      this.delete(discordUser)
    }, this._evictionTimeMs);
  }

  public get(discordUser: User) {
    return this._map.get(discordUser.id);
  }
  
  public delete(discordUser: User) {
    this._map.delete(discordUser.id);
  }
}