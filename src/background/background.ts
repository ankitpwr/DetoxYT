import axios from "axios";

const API_KEY = process.env.YT_API_KEY2;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

console.log("welcome to background script");

async function fetchVideos(topic: string, tabId: any) {
  console.log(`api key is ${API_KEY}`);
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: "snippet",
        type: "video",
        q: encodeURIComponent(topic),
        maxResults: 5,
        key: API_KEY,
      },
    });
    console.log(response.data);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab != null && tab.id != null && typeof tab.id == "number") {
        chrome.tabs.sendMessage(
          tab.id,
          { type: "VIDEOS", videos: response.data.items },
          (response) => {
            console.log("response received !");
            console.log(response);
          }
        );
      }
    });
  } catch (error) {
    console.log(error);
  }
}
chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker has been installed!");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("message is ");
  console.log(message);
  console.log("sender is ");
  console.log(sender);
  if (message.type == "FETCH_VIDEOS") {
    fetchVideos(message.topic, sender.tab?.id).then(() =>
      sendResponse({ ok: true })
    );
    return true;
  }

  sendResponse({ reply: "got your message" });
});
