console.log("welcome to content script");

let currentTopic = "";
let totalRelatedVideosCount = 0;
let hasFetched = false;
let isInjecting = false;
let cachedVideos: any[] | null = null;

initialize();

function initialize() {
  chrome.storage.sync
    .get(["Videostitle", "videos", "topic"])
    .then((result) => {
      console.log(`result is `);
      console.log(result);
      if (result.topic) {
        currentTopic = result.topic;
      }
      if (result.Videostitle == result.topic) {
        cachedVideos = result.videos;
        return result.videos;
      }
      runCleanup();
    })
    .catch((err) => console.error("Storage error:", err));
}
function cacheVideos(videos: any[]) {
  chrome.storage.sync.set({ Videostitle: currentTopic, videos: videos });
}

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
    console.log("self watcher");
    injectVideos(cachedVideos);
  }
});
shelfWatcher.observe(document.body, { childList: true, subtree: true });

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
  console.log(`currentTopic is ${currentTopic}`);
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
      console.log("calling background script");
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

chrome.runtime.onMessage.addListener((msg, sender, sendReponse) => {
  console.log("message arrived");
  console.log(msg);
  if (msg.type == "VIDEOS" && msg.videos && Array.isArray(msg.videos)) {
    cachedVideos = msg.videos;
    cacheVideos(msg.videos);
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
  if (!grid) {
    console.log("feed container not found");
    return;
  }
  if (isInjecting) return;
  isInjecting = true;

  try {
    const existing = document.getElementById("my-extension-shelf");
    if (existing) existing.remove();

    const shelf = document.createElement("div");
    shelf.id = "my-extension-shelf";
    shelf.setAttribute("data-extension-shelf", "true");
    shelf.style.width = "100%";
    shelf.style.marginBottom = "40px";
    shelf.style.padding = "0 20px";

    shelf.innerHTML = `
      <style>
        /* GRID: force 3 columns like YouTube desktop */
        #my-extension-shelf .my-shelf-grid-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr); /* 3 columns */
          gap: 24px 20px; /* vertical gap, horizontal gap */
          align-items: start;
        }

        /* Card */
        #my-extension-shelf .ext-card {
          width: 100%;
          color: inherit;
          text-decoration: none;
          font-family: inherit;
        }

        /* Thumbnail container ensures exact 16:9 box */
        #my-extension-shelf .ext-thumb {
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 8px;
          overflow: hidden;
          background-color: #222;
          position: relative;
          display: block;
        }

        #my-extension-shelf .ext-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Details row - channel avatar + meta */
        #my-extension-shelf .ext-details {
          display: flex;
          margin-top: 10px;
          gap: 12px;
        }

        #my-extension-shelf .ext-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #444;
          flex: 0 0 36px;
          overflow: hidden;
          display: inline-block;
        }

        #my-extension-shelf .ext-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        #my-extension-shelf .ext-title {
          margin: 0;
          padding: 0;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.35;
          color: var(--yt-spec-text-primary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        #my-extension-shelf .ext-subline {
          margin-top: 6px;
          font-size: 12px;
          color: var(--yt-spec-text-secondary);
          line-height: 1.3;
        }

        /* Make shelf title visually similar to ytd shelves */
        #my-extension-shelf .ext-shelf-header {
          display:flex;
          align-items:center;
          gap:12px;
          padding: 0 0 16px 0;
        }
        #my-extension-shelf .ext-shelf-title {
          font-size: 1.6rem;
          line-height: 2.2rem;
          font-weight: 700;
          color: var(--yt-spec-text-primary);
          margin: 0;
        }

        /* Responsive fallback: if viewport is narrow, switch to 2 / 1 columns */
        @media (max-width: 1200px) {
          #my-extension-shelf .my-shelf-grid-row { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 800px) {
          #my-extension-shelf .my-shelf-grid-row { grid-template-columns: repeat(1, 1fr); }
        }
      </style>

      <div class="ext-shelf-header">
        <h2 id="title" class="ext-shelf-title">
          Recommended for "${currentTopic}"
        </h2>
      </div>

      <div class="my-shelf-grid-row"></div>
    `;

    const row = shelf.querySelector(".my-shelf-grid-row");
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

      const publishTime = (v.snippet && v.snippet.publishTime) || "";

      const card = document.createElement("div");
      card.className = "ext-card";

      card.innerHTML = `
        <a class="ext-thumb" href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer">
          <img src="${thumb}" alt="${escapeHtml(title)}">
        </a>

        <div class="ext-details">
          <div class="ext-avatar" aria-hidden="true"></div>

          <div class="ext-meta">
            <h3 class="ext-title">
              <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">
                ${escapeHtml(title)}
              </a>
            </h3>

            <div class="ext-subline">
              <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(
                channel
              )}</div>
              <div style="margin-top:2px;">${escapeHtml(
                formatTimeAgo(publishTime)
              )}</div>
            </div>
          </div>
        </div>
      `;

      row.appendChild(card);
    });

    // Inject the entire shelf at the top of the grid
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

function formatTimeAgo(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const months = Math.round(days / 30.44);
    const years = Math.round(days / 365.25);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
    return `${years} year${years > 1 ? "s" : ""} ago`;
  } catch (e) {
    console.error("Could not format date", e);
    return "";
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
