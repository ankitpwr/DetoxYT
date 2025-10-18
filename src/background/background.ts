import axios from "axios";

const API_KEY = process.env.YT_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

console.log("welcome to background script");

async function fetchVideos(topic: string) {
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
  if (message.type == "FETCH_VIDEOS") {
  }

  fetchVideos(message.topic);
  sendResponse({ reply: "got your message content script" });
});
