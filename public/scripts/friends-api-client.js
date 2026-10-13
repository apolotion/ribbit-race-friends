"use strict";

/** Owns all same-origin Friends API requests and their timeout/error policy. */
class FriendsApiClient {
  constructor({ basePath = "/api", timeoutMs = 20000, friendsVersion = 1 } = {}) {
    this.basePath = basePath.replace(/\/$/, "");
    this.timeoutMs = timeoutMs;
    this.friendsVersion = friendsVersion;
  }

  async call(method, payload = {}) {
    if (location.protocol === "file:") {
      throw new Error("Open your deployed Friends game link, not this downloaded file, for cloud features.");
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.basePath}/${method}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, friendsVersion: this.friendsVersion }),
        signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok && !result?.message) {
        throw new Error(`Server request failed (${response.status}).`);
      }
      return result;
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("The cloud server did not respond. Your current game has not been reset.");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

window.FriendsApiClient = FriendsApiClient;
window.RibbitFriendsApi = new FriendsApiClient();
