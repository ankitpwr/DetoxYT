let currentTopic = "";
let totalRelatedVideosCount = 0;
let hasFetched = false;
let isInjecting = false;
let cachedVideos: any[] | null = null;
chrome.storage.sync.get(["topic"], (result) => {
  if (result) {
    currentTopic = result.topic;
    console.log(`current topic is ${currentTopic}`);
    runCleanup();
  }
});
console.log("welcome to content script");

const SELECTORS = {
  shorts: {
    sidebarLink: 'a[title="Shorts"]',
    shelf: "ytd-rich-shelf-renderer[is-shorts]",
  },
  sidebars: {
    main: "ytd-guide-renderer",
    mini: "ytd-mini-guide-renderer",
    secondary: "ytd-watch-next-secondary-results-renderer",
    topicFilters: "iron-selector",
  },
  videos: {
    video: "ytd-rich-item-renderer",
  },
};

const hideElement = (selector: string) => {
  if (selector == SELECTORS.shorts.shelf) {
    const elements = document.querySelectorAll(selector);
    if (elements) {
      elements.forEach((container) => {
        if ((container as HTMLElement).style.display != "none")
          (container as HTMLElement).style.display = "none";
      });
    }
  } else if (selector == SELECTORS.videos.video) {
    const element = document.querySelectorAll(selector);
    element.forEach((container) => {
      const title = (container as HTMLElement).innerText || "";
      if (currentTopic) {
        if (!title.toLowerCase().includes(currentTopic.toLowerCase())) {
          if ((container as Element).querySelector("[data-extension-shelf]"))
            return;
          (container as HTMLElement).style.display = "none";
        } else totalRelatedVideosCount++;
      }
    });
  } else {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && element.style.display != "none") {
      element.style.display = "none";
    }
  }
};

const runCleanup = () => {
  console.log("clean up runs");
  if (isInjecting) {
    console.log("video injection is working");
  }
  totalRelatedVideosCount = 0;
  hideElement(SELECTORS.shorts.sidebarLink);
  hideElement(SELECTORS.shorts.shelf);
  hideElement(SELECTORS.sidebars.main);
  hideElement(SELECTORS.sidebars.mini);
  hideElement(SELECTORS.sidebars.secondary);
  hideElement(SELECTORS.sidebars.topicFilters);
  hideElement(SELECTORS.videos.video);

  if (
    totalRelatedVideosCount < 5 &&
    hasFetched == false &&
    currentTopic != ""
  ) {
    hasFetched = true;
    console.log("less video so fetch the vidio");
    if (cachedVideos) {
      console.log("got cached videos");
      injectVideos(cachedVideos);
    } else {
      chrome.runtime.sendMessage(
        {
          type: "FETCH_VIDEOS",
          topic: currentTopic,
        },
        (reponse) => {
          if (chrome.runtime.lastError) {
            console.log("error occured");
            console.error(chrome.runtime.lastError.message);
          } else {
            console.log(reponse);
          }
        }
      );
    }
  }
};

const feedContainer =
  document.querySelector("ytd-rich-grid-renderer") ||
  document.querySelector("ytd-browse") ||
  document.querySelector("ytd-two-column-browse-results-renderer") ||
  document.querySelector("#contents") ||
  document.body;

const observer = new MutationObserver(() => runCleanup());
if (feedContainer) {
  observer.observe(feedContainer, { childList: true, subtree: true });
} else {
  observer.observe(document.body, { childList: true, subtree: true });
}

const shelfWatcher = new MutationObserver(() => {
  if (
    !document.getElementById("my-extension-shelf") &&
    cachedVideos &&
    currentTopic
  ) {
    injectVideos(cachedVideos);
  }
});
shelfWatcher.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((msg, sender, sendReponse) => {
  console.log("message arrived");
  console.log(msg);
  if (msg.type == "VIDEOS" && msg.videos && Array.isArray(msg.videos)) {
    cachedVideos = msg.videos;
    observer.disconnect();
    injectVideos(msg.videos);
    if (feedContainer) {
      observer.observe(feedContainer, { childList: true, subtree: true });
    } else {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
  sendReponse({ status: "New message! " });
  return true;
});

function injectVideos(videos: any[]) {
  console.log("injecting vidoes");
  const grid = document.querySelector(`ytd-rich-grid-renderer #contents`);
  console.log(grid);
  if (!grid) return console.warn("feed container not found");
  if (isInjecting) return;
  isInjecting = true;
  try {
    const existing = document.getElementById("my-extension-shelf");
    if (existing) existing.remove();
    const shelf = document.createElement("div");
    shelf.id = "my-extension-shelf";
    shelf.style.padding = "12px 0";
    shelf.style.marginBottom = "16px";
    shelf.setAttribute("data-extension-shelf", "true");
    shelf.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:0 12px;">
      <h2 style="margin:0;font-size:16px">Recommended for "${currentTopic}"</h2>
      <small style="color:var(--yt-spec-text-secondary)">${videos.length} videos</small>
    </div>
    <div class="my-shelf-row" style="display:flex;gap:12px;overflow-x:auto;padding:12px;">
    </div>
  `;

    const row = shelf.querySelector(".my-shelf-row");
    if (!row) return;
    videos.forEach((v) => {
      const videoId =
        v.id?.videoId ||
        (v.id && v.id.kind === "youtube#video" && v.id.videoId) ||
        "";
      const title = (v.snippet && v.snippet.title) || "Untitled";
      const channel = v.snippet?.channelTitle || "";
      const thumb =
        v.snippet?.thumbnails?.high?.url ||
        v.snippet?.thumbnails?.medium?.url ||
        "";

      const card = document.createElement("a");
      card.href = `https://www.youtube.com/watch?v=${videoId}`;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.style.minWidth = "320px";
      card.style.textDecoration = "none";
      card.style.color = "inherit";
      card.style.display = "block";

      card.innerHTML = `
      <div style="width:100%;height:180px;overflow:hidden;border-radius:8px;background:#111">
        <img src="${thumb}" alt="${escapeHtml(
        title
      )}" style="width:100%;height:100%;object-fit:cover;display:block;">
      </div>
      <div style="padding:8px 0;">
        <div style="font-size:14px;line-height:1.2;max-height:2.4em;overflow:hidden">${escapeHtml(
          title
        )}</div>
        <div style="font-size:12px;color:var(--yt-spec-text-secondary);margin-top:6px">${escapeHtml(
          channel
        )}</div>
      </div>
    `;

      row.appendChild(card);
    });
    const firstChild = grid.firstElementChild;
    if (firstChild) {
      grid.insertBefore(shelf, firstChild);
    } else {
      grid.appendChild(shelf);
    }
  } finally {
    isInjecting = false;
  }
}
function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
