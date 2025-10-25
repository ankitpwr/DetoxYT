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
  ads: {
    topads: "ytd-ad-slot-renderer",
  },
  feed: {
    container: "ytd-rich-grid-renderer #contents",
    grid: "ytd-rich-grid-renderer",
  },
};

const LOADER_ID = "detox-Loader";
const SHELF_ID = "my-extension-shelf";

class YoutubeDetox {
  private currentTopic: string = "";
  private totalRelatedVideoCount: number = 0;
  private hadFetched: boolean = false;
  private isInjecting: boolean = false;
  private cachedVideos: any[] | null = null;
  private feedContainer: Element | null = null;
  private domObserver: MutationObserver;
  private shelfObserver: MutationObserver;

  constructor() {
    this.feedContainer =
      document.querySelector(SELECTORS.feed.grid) ||
      document.querySelector("ytd-browse") ||
      document.querySelector("ytd-two-column-browse-results-renderer") ||
      document.querySelector("#contents") ||
      document.body;
    this.domObserver = new MutationObserver(() => this.filterPageContent());
    this.shelfObserver = new MutationObserver(() => {
      if (
        !document.getElementById("my-extension-shelf") &&
        this.cachedVideos &&
        this.currentTopic
      ) {
        console.log("self watcher");
        this.injectShelf(this.cachedVideos);
      }
    });
    this.init();
  }

  private async init() {
    console.log("initializing the Youtube detox");
    this.addLoader();
    await this.loadInitialState();
    this.setUpListner();
    this.setUpObserver();
    this.addShelfWatcher();
    this.setUpListner();
    this.filterPageContent();
    this.hideLoader();
  }

  private async loadInitialState() {
    console.log("initial load starting");
    const syncResult = await chrome.storage.sync.get(["topic"]);
    if (syncResult && syncResult.topic) {
      this.currentTopic = syncResult.topic;
    } else {
      console.log("No topic found!");
    }

    const localResult = await chrome.storage.local.get([
      "Videostitle",
      "videos",
    ]);
    if (
      localResult &&
      localResult.Videostitle == this.currentTopic &&
      localResult.videos
    ) {
      this.cachedVideos = localResult.videos;
    }
  }

  private setUpObserver() {
    console.log("start observing the dom");
    if (this.feedContainer) {
      this.domObserver.observe(this.feedContainer, {
        childList: true,
        subtree: true,
      });
    } else {
      this.domObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }
  private stopObserver() {
    this.domObserver.disconnect();
  }

  private addShelfWatcher() {
    this.shelfObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private setUpListner() {
    console.log("start listning for messages");
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === "VIDEOS" && msg.videos && Array.isArray(msg.videos)) {
        console.log("Received videos from service worker");
        this.cachedVideos = msg.videos;
        this.cacheVideos(msg.videos);
        this.stopObserver();
        this.injectShelf(this.cachedVideos);
        this.setUpObserver();
      }
      sendResponse({ status: "Message received by content script." });
      return true;
    });
  }

  private filterPageContent() {
    console.log("filteration of page started");
    if (this.isInjecting) return;
    this.stopObserver();
    this.hideElement(SELECTORS.shorts.sidebarLink);
    this.hideAllElements(SELECTORS.shorts.shelf);
    this.hideElement(SELECTORS.sidebars.main);
    this.hideElement(SELECTORS.sidebars.mini);
    this.hideElement(SELECTORS.sidebars.secondary);
    this.hideElement(SELECTORS.sidebars.topicFilters);
    this.hideElement(SELECTORS.ads.topads);
    this.setUpObserver();
    const relatedVideosCount = this.filterVideoElement();
    if (relatedVideosCount < 6) {
      console.log(`total video count are ${relatedVideosCount}`);
      this.requestVideos();
    }
  }

  private hideElement(selector: string) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && element.style.display !== "none") {
      element.style.display = "none";
    }
  }
  private hideAllElements(selector: string) {
    const elements = document.querySelectorAll<HTMLElement>(selector);
    elements.forEach((container) => {
      if (container.style.display !== "none") {
        container.style.display = "none";
      }
    });
  }

  private filterVideoElement() {
    let relatedCount = 0;
    const elements = document.querySelectorAll<HTMLElement>(
      SELECTORS.videos.video
    );
    elements.forEach((container) => {
      if (
        container.id === SHELF_ID ||
        container.querySelector(`[data-extension-shelf="true"]`)
      ) {
        return;
      }

      if (!this.currentTopic) {
        container.style.display = "none";
        return;
      }

      const title = container.innerText || "";
      if (!title.toLowerCase().includes(this.currentTopic.toLowerCase())) {
        container.style.display = "none";
      } else {
        container.style.display = "";
        relatedCount++;
      }
    });
    return relatedCount;
  }

  private requestVideos() {
    console.log("called request videos");
    console.log(this.hadFetched);
    console.log(this.currentTopic);
    if (!this.hadFetched && this.currentTopic) {
      this.hadFetched = true;
      console.log("Few related videos found. Requesting custom shelf.");

      if (this.cachedVideos) {
        console.log("Using cached videos to inject shelf.");
        this.stopObserver();
        this.injectShelf(this.cachedVideos);
        this.setUpObserver();
      } else {
        console.log("No cached videos. Fetching from service worker.");
        this.fetchVideos();
      }
    }
  }

  async cacheVideos(videos: any[]) {
    console.log("Caching videos for topic:", this.currentTopic);
    try {
      await chrome.storage.local.set({
        Videostitle: this.currentTopic,
        videos: videos,
      });
    } catch (e) {
      console.error("Error caching videos:", e);
    }
  }

  private fetchVideos() {
    console.log("sending message for fetching the videos");
    chrome.runtime.sendMessage(
      {
        type: "FETCH_VIDEOS",
        topic: this.currentTopic,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error sending FETCH_VIDEOS message:",
            chrome.runtime.lastError.message
          );

          this.hadFetched = false;
        } else {
          console.log("FETCH_VIDEOS message sent, response:", response);
        }
      }
    );
  }

  private addLoader() {
    console.log("adding loader");
    if (document.getElementById(LOADER_ID)) return;
    const loader = document.createElement("div");
    loader.id = LOADER_ID;
    loader.style.cssText = `
      background: black;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.3s ease-out;
      opacity: 1;
    `;
    loader.innerHTML = `
      <div style="text-align: center; color: white;">
        <div style="width: 48px; height: 48px; border: 4px solid #333; border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        <style>
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </div>
    `;
    document.body.appendChild(loader);
  }
  private hideLoader() {
    console.log("hidding loader");
    const loader = document.getElementById(LOADER_ID) as HTMLElement;
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 300);
    }
  }

  private injectShelf(videos: any[] | null) {
    if (!videos) return;
    console.log("injecting vidoes");
    const grid = document.querySelector(`ytd-rich-grid-renderer #contents`);
    if (!grid) {
      console.log("feed container not found");
      return;
    }
    if (this.isInjecting) return;
    this.isInjecting = true;

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
          Recommended for "${this.currentTopic}"
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

      const firstChild = grid.firstElementChild;
      if (firstChild) {
        grid.insertBefore(shelf, firstChild);
      } else {
        grid.appendChild(shelf);
      }
    } finally {
      this.isInjecting = false;
    }
  }
}

new YoutubeDetox();

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
