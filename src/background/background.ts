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
        maxResults: 24,
        order: "viewCount",
        videoType: "any",
        videoDuration: "long",
        videoDefinition: "high",
        key: API_KEY,
      },
    });
    console.log("fetched videos are");
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
  } else if (message.type == "HISTORIC_VIDEOS") {
    if (sender && sender.tab && sender.tab.id) getHistoricVideo(sender.tab.id);
    sendResponse({ ok: "got the message" });
  }
  sendResponse({ reply: "got your message" });
});

async function getHistoricVideo(tabId: number) {
  const syncResult = await chrome.storage.sync.get(["topic"]);
  console.log(`sync Result are`);
  console.log(syncResult);
  const currentTopic = syncResult.topic;
  const historicData = await chrome.history.search({
    text: `youtube.com/watch`,
    startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
    maxResults: 1000,
  });

  const filterVideo = historicData.filter((item) => {
    const title = item.title || "";
    console.log("title is ", title);

    return title.toLowerCase().includes(currentTopic.toLowerCase());
  });
  const releventVideos = filterVideo.map(async (item) => {
    const videoId = new URL(item.url!).searchParams.get("v");
    console.log("new item");
    try {
      const response = await axios.get(`${BASE_URL}/videos`, {
        params: {
          part: "snippet,contentDetails,statistics",
          id: videoId,
          key: API_KEY,
        },
      });
      return response.data.items[0] ?? null;
    } catch (err) {
      console.warn("fetch video failed for", item.url, err);
      return null;
    }
  });
  const newData = await Promise.all(releventVideos);
  chrome.tabs.sendMessage(
    tabId,
    { type: "HISTORIC_VIDEOS", videos: newData },
    (response) => {
      console.log("response received !");
      console.log(response);
    }
  );
  // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  //   console.log("tabs is ");
  //   console.log(tabs);
  //   const tab = tabs[0];
  //   console.log(tab);
  //   console.log(tab?.id);
  //   console.log(typeof tab?.id);

  //   if (tab != null && tab.id != null && typeof tab.id == "number") {
  //     console.log("sending the data to content script");
  //     console.log(newData);

  //   }
  // });
}
