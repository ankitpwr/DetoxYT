import axios from "axios";
const API_KEY = process.env.YT_API_KEY2;
const BASE_URL = "https://www.googleapis.com/youtube/v3";
///--------------------------------------------
console.log("welcome to background script");
async function query(data: any) {
  const response = await axios.post(
    "https://router.huggingface.co/v1/chat/completions",
    data,
    {
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
      },
    }
  );
  console.log("data is ");
  const responseData = response.data.choices[0].message.content;
  console.log(responseData);
  const arr = responseData.split(",");
  console.log(arr);
}

query({
  messages: [
    {
      role: "user",
      content:
        "Generate 15 related keywords/concepts for: nodejs Include:- Prioritize keywords a developer would use when researching this topic, consider topic which might comes before and after learning this topic, technical concepts and terminology, Related technologies and tools, names/synonyms. Format: Return only comma-separated keywords, no explanations. Example for Kubernetes: devops, container orchestration, docker, k8s, ConfigMaps and Secrets, Cluster Architecture, helm Charts, docker swarm, AWS ECS, K3s, Nomad",
    },
  ],
  model: "openai/gpt-oss-20b:groq",
});

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
}
