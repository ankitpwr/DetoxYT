const LOADER_ID = "detox-loader";
const SHELF_ID = "detox-shelf";

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
    topAds: "ytd-ad-slot-renderer",
  },
  feed: {
    contents: "ytd-rich-grid-renderer #contents",
    grid: "ytd-rich-grid-renderer",
  },
} as const;

/** Escape user-supplied strings before inserting into innerHTML. */
function escapeHtml(text = ""): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

//Convert an ISO date string to a relative time label.
function formatTimeAgo(dateString: string): string {
  if (!dateString) return "";
  try {
    const seconds = Math.round(
      (Date.now() - new Date(dateString).getTime()) / 1_000,
    );
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const months = Math.round(days / 30.44);
    const years = Math.round(days / 365.25);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours}   hour${hours > 1 ? "s" : ""} ago`;
    if (days < 30) return `${days}    day${days > 1 ? "s" : ""} ago`;
    if (months < 12) return `${months}  month${months > 1 ? "s" : ""} ago`;
    return `${years} year${years > 1 ? "s" : ""} ago`;
  } catch {
    return "";
  }
}

const SHELF_STYLES = `
  #${SHELF_ID} {
    width: 100%;
    margin-bottom: 40px;
    padding: 0 20px;
    box-sizing: border-box;
  }

  /* ── Header ── */
  #${SHELF_ID} .detox-shelf-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 0 24px 0;
  }

  #${SHELF_ID} .detox-shelf-title {
    margin: 0;
    font-size: 2rem;
    line-height: 2.8rem;
    font-weight: 700;
    font-family: "YouTube Sans", "Roboto", sans-serif;
    color: var(--yt-spec-text-primary);
  }

  /* ── Responsive grid ── */
  #${SHELF_ID} .detox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 40px 16px;
    align-items: start;
  }

  @media (max-width: 800px) {
    #${SHELF_ID} .detox-grid {
      grid-template-columns: 1fr;
    }
  }

  /* ── Card ── */
  #${SHELF_ID} .detox-card {
    width: 100%;
    font-family: "Roboto", "Arial", sans-serif;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
  }

  /* ── Thumbnail ── */
  #${SHELF_ID} .detox-thumb {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    transition: border-radius 0.2s ease;
  }

  #${SHELF_ID} .detox-thumb:hover {
    border-radius: 0;
  }

  #${SHELF_ID} .detox-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* ── Details row ── */
  #${SHELF_ID} .detox-details {
    display: flex;
    margin-top: 12px;
    gap: 12px;
  }

  #${SHELF_ID} .detox-avatar {
    flex: 0 0 36px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    background-color: var(--yt-spec-10-percent-layer, #e0e0e0);
  }

  #${SHELF_ID} .detox-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding-right: 24px;
  }

  /* ── Title ── */
  #${SHELF_ID} .detox-title {
    margin: 0;
    padding: 0;
    font-size: 1.6rem;
    font-weight: 500;
    line-height: 2.2rem;
    color: var(--yt-spec-text-primary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  #${SHELF_ID} .detox-title a {
    color: inherit;
    text-decoration: none;
  }

  /* ── Sub-line (channel, date) ── */
  #${SHELF_ID} .detox-subline {
    display: flex;
    flex-direction: column;
    margin-top: 4px;
    font-size: 1.4rem;
    font-weight: 400;
    line-height: 2rem;
    color: var(--yt-spec-text-secondary);
  }

  #${SHELF_ID} .detox-subline-channel {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  #${SHELF_ID} .detox-subline-date {
    margin-top: 2px;
  }

  #${SHELF_ID} .detox-subline div:hover {
    color: var(--yt-spec-text-primary);
  }

  /* ── prefers-color-scheme fallbacks ──────────────────────────────────────
     These only apply when YouTube's CSS vars haven't resolved yet.
     Once the vars are set (which happens almost immediately), they take over.
  ── */
  @media (prefers-color-scheme: light) {
    #${SHELF_ID} .detox-shelf-title { color: var(--yt-spec-text-primary,   #0f0f0f); }
    #${SHELF_ID} .detox-title        { color: var(--yt-spec-text-primary,   #0f0f0f); }
    #${SHELF_ID} .detox-subline      { color: var(--yt-spec-text-secondary, #606060); }
    #${SHELF_ID} .detox-avatar       { background-color: var(--yt-spec-10-percent-layer, #e0e0e0); }
  }

  @media (prefers-color-scheme: dark) {
    #${SHELF_ID} .detox-shelf-title { color: var(--yt-spec-text-primary,   #f1f1f1); }
    #${SHELF_ID} .detox-title        { color: var(--yt-spec-text-primary,   #f1f1f1); }
    #${SHELF_ID} .detox-subline      { color: var(--yt-spec-text-secondary, #aaaaaa); }
    #${SHELF_ID} .detox-avatar       { background-color: var(--yt-spec-10-percent-layer, #272727); }
  }

  /* ── Spinner animation (used by the loader) ── */
  @keyframes detox-spin {
    to { transform: rotate(360deg); }
  }
`;

//main class
class YoutubeDetox {
  private currentTopic: string = "";
  private hadFetched: boolean = false;
  private cachedVideos: any[] | null = null;
  private watchedVideos: any[] | null = null;
  private relatedTopics: string[] = [];

  //DOM references
  private feedContainer: Element | null = null;

  //Observers
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
      const shelfMissing = !document.getElementById(SHELF_ID);
      if (shelfMissing && this.cachedVideos && this.currentTopic) {
        const merged = this.mergeVideos(
          this.cachedVideos,
          this.watchedVideos ?? [],
        );
        this.injectShelf(merged);
      }
    });

    this.init();
  }

  private async init(): Promise<void> {
    this.addLoader();
    await this.loadInitialState();
    await this.loadHistoricVideos();
    this.setupMessageListener();
    this.shelfObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    this.startObserver();
    this.filterPageContent();
    this.hideLoader();
  }

  // get persisted topic + videos from Chrome storage.
  private async loadInitialState(): Promise<void> {
    const sync = await chrome.storage.sync.get(["topic"]);
    if (sync.topic) this.currentTopic = sync.topic;

    const local = await chrome.storage.local.get([
      "Videostitle",
      "videos",
      "relatedTopic",
    ]);

    if (local.videos && local.Videostitle === this.currentTopic) {
      this.cachedVideos = local.videos;
    }

    if (Array.isArray(local.relatedTopic)) {
      this.relatedTopics = local.relatedTopic;
    }
  }

  // Load historically-watched videos from cache, or request a fresh fetch.
  private async loadHistoricVideos(): Promise<void> {
    const local = await chrome.storage.local.get([
      "WatchedVideos",
      "Videostitle",
    ]);

    if (local.WatchedVideos && local.Videostitle === this.currentTopic) {
      this.watchedVideos = local.WatchedVideos;
    } else {
      chrome.runtime.sendMessage({ type: "HISTORIC_VIDEOS" }, () => {});
    }
  }

  // Message listener

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg.type === "VIDEOS" && Array.isArray(msg.videos)) {
        this.cachedVideos = msg.videos;
        this.cacheVideos(msg.videos);
      } else if (msg.type === "HISTORIC_VIDEOS" && Array.isArray(msg.videos)) {
        this.watchedVideos = msg.videos;
        this.cacheWatchedVideos(msg.videos);
      }

      const merged = this.mergeVideos(
        this.cachedVideos ?? [],
        this.watchedVideos ?? [],
      );
      this.stopObserver();
      this.injectShelf(merged);
      this.startObserver();

      sendResponse({ status: "received" });
      return true;
    });
  }

  //Storage helpers function
  private async cacheVideos(videos: any[]): Promise<void> {
    try {
      await chrome.storage.local.set({
        Videostitle: this.currentTopic,
        videos,
      });
    } catch (error) {
      console.log(error);
    }
  }

  //cache watched videos
  private async cacheWatchedVideos(videos: any[]): Promise<void> {
    try {
      await chrome.storage.local.set({
        Videostitle: this.currentTopic,
        WatchedVideos: videos,
      });
    } catch (error) {
      console.log(error);
    }
  }

  // DOM observer
  private startObserver(): void {
    const target = this.feedContainer ?? document.body;
    this.domObserver.observe(target, { childList: true, subtree: true });
  }

  private stopObserver(): void {
    this.domObserver.disconnect();
  }

  //Page filtering
  private filterPageContent(): void {
    this.stopObserver();

    // Hide distracting UI elements
    this.hideElement(SELECTORS.shorts.sidebarLink);
    this.hideAllElements(SELECTORS.shorts.shelf);
    this.hideElement(SELECTORS.sidebars.main);
    this.hideElement(SELECTORS.sidebars.mini);
    this.hideElement(SELECTORS.sidebars.secondary);
    this.hideElement(SELECTORS.sidebars.topicFilters);
    this.hideElement(SELECTORS.ads.topAds);

    this.startObserver();

    const relatedCount = this.filterVideoElements();
    if (relatedCount < 6) this.requestVideos();
  }

  private filterVideoElements(): number {
    let relatedCount = 0;

    document
      .querySelectorAll<HTMLElement>(SELECTORS.videos.video)
      .forEach((el) => {
        // avoid custom injected shelf cards
        if (
          el.id === SHELF_ID ||
          el.querySelector('[data-extension-shelf="true"]')
        )
          return;

        if (!this.currentTopic) {
          el.style.display = "none";
          return;
        }

        const text = el.innerText.toLowerCase();
        const topicMatch = text.includes(this.currentTopic.toLowerCase());
        const relatedMatch = this.relatedTopics.some((t) =>
          text.includes(t.toLowerCase()),
        );

        if (topicMatch || relatedMatch) {
          relatedCount++;
        } else {
          el.style.display = "none";
        }
      });

    return relatedCount;
  }

  private hideElement(selector: string): void {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && el.style.display !== "none") el.style.display = "none";
  }

  private hideAllElements(selector: string): void {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      if (el.style.display !== "none") el.style.display = "none";
    });
  }

  //fetching relevent videos
  private requestVideos(): void {
    if (this.hadFetched || !this.currentTopic) return;
    this.hadFetched = true;

    if (this.cachedVideos) {
      this.stopObserver();
      this.injectShelf(
        this.mergeVideos(this.cachedVideos, this.watchedVideos ?? []),
      );
      this.startObserver();
    } else {
      chrome.runtime.sendMessage(
        { type: "FETCH_VIDEOS", topic: this.currentTopic },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "[DetoxYT] FETCH_VIDEOS failed:",
              chrome.runtime.lastError.message,
            );
            this.hadFetched = false; // allow retry
          }
        },
      );
    }
  }

  // ── Video ID extraction ────────────────────────────────────────────────────

  private getVideoId(v: any): string | null {
    if (!v) return null;
    if (typeof v.id === "string") return v.id;
    if (v.id?.videoId) return v.id.videoId;
    if (v.videoId) return v.videoId;
    if (v.snippet?.resourceId?.videoId) return v.snippet.resourceId.videoId;
    if (v.url) {
      try {
        return new URL(v.url).searchParams.get("v");
      } catch {}
    }
    return null;
  }

  //Merge fetched + watched videos.
  private mergeVideos(fetched: any[], watched: any[]): any[] {
    const map = new Map<string, any>();
    const add = (item: any) => {
      const id = this.getVideoId(item);
      if (id && !map.has(id)) map.set(id, item);
    };
    watched.forEach(add);
    fetched.forEach(add);
    return Array.from(map.values());
  }

  //Loader
  private addLoader(): void {
    if (document.getElementById(LOADER_ID)) return;

    const loader = document.createElement("div");
    loader.id = LOADER_ID;
    loader.style.cssText = `
      background: var(--yt-spec-base-background);
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.3s ease-out;
      opacity: 1;
    `;

    loader.innerHTML = `
      <style>
        /* Loader colour tokens — fall back gracefully on both modes */
        @media (prefers-color-scheme: light) {
          #${LOADER_ID} { background: var(--yt-spec-base-background, #ffffff) !important; }
          .detox-spinner { border-color: var(--yt-spec-10-percent-layer, #e0e0e0) !important; border-top-color: var(--yt-spec-text-primary, #0f0f0f) !important; }
        }
        @media (prefers-color-scheme: dark) {
          #${LOADER_ID} { background: var(--yt-spec-base-background, #0f0f0f) !important; }
          .detox-spinner { border-color: var(--yt-spec-10-percent-layer, #272727) !important; border-top-color: var(--yt-spec-text-primary, #f1f1f1) !important; }
        }
      </style>

      <div class="detox-spinner" style="
        width: 48px; height: 48px;
        border: 4px solid var(--yt-spec-10-percent-layer, #333);
        border-top-color: var(--yt-spec-text-primary, #fff);
        border-radius: 50%;
        animation: detox-spin 0.9s linear infinite;
      "></div>
    `;

    document.body.appendChild(loader);
  }

  private hideLoader(): void {
    const loader = document.getElementById(LOADER_ID);
    if (!loader) return;
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 300);
  }

  // Shelf injection
  private injectShelf(videos: any[] | null): void {
    if (!videos?.length) return;

    const grid = document.querySelector(SELECTORS.feed.contents);
    if (!grid) {
      console.warn("[DetoxYT] Feed container not found — shelf not injected.");
      return;
    }

    document.getElementById(SHELF_ID)?.remove();

    const shelf = document.createElement("div");
    shelf.id = SHELF_ID;
    shelf.setAttribute("data-extension-shelf", "true");

    const styleTag = document.createElement("style");
    styleTag.textContent = SHELF_STYLES;
    shelf.appendChild(styleTag);

    // Header
    const header = document.createElement("div");
    header.className = "detox-shelf-header";
    header.innerHTML = `
      <h2 class="detox-shelf-title">Recommended for "${escapeHtml(this.currentTopic)}"</h2>
    `;
    shelf.appendChild(header);

    // Grid
    const gridRow = document.createElement("div");
    gridRow.className = "detox-grid";

    videos.forEach((v) => {
      const card = this.buildCard(v);
      if (card) gridRow.appendChild(card);
    });

    shelf.appendChild(gridRow);

    grid.insertBefore(shelf, grid.firstElementChild ?? null);
  }

  // Build a single video card element. Returns null if the video is invalid.
  private buildCard(v: any): HTMLElement | null {
    const videoId = this.getVideoId(v);
    if (!videoId) return null;

    const rawTitle = v.snippet?.title || "Untitled";
    const channel = v.snippet?.channelTitle || "";
    const publishTime = v.snippet?.publishTime || "";
    const thumb =
      v.snippet?.thumbnails?.high?.url ||
      v.snippet?.thumbnails?.medium?.url ||
      "";

    const title = escapeHtml(rawTitle);
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const card = document.createElement("div");
    card.className = "detox-card";
    card.innerHTML = `
      <a class="detox-thumb" href="${url}" target="_blank" rel="noopener noreferrer">
        <img src="${thumb}" alt="${title}" loading="lazy">
      </a>

      <div class="detox-details">
        <div class="detox-avatar" aria-hidden="true"></div>

        <div class="detox-meta">
          <h3 class="detox-title">
            <a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>
          </h3>

          <div class="detox-subline">
            <div class="detox-subline-channel">${escapeHtml(channel)}</div>
            <div class="detox-subline-date">${escapeHtml(formatTimeAgo(publishTime))}</div>
          </div>
        </div>
      </div>
    `;

    return card;
  }
}

async function init(): Promise<void> {
  const { extensionStatus } = await chrome.storage.sync.get([
    "extensionStatus",
  ]);
  if (extensionStatus === true) new YoutubeDetox();
}

init();
