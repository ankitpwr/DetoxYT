let currentTopic = "";
let totalRelatedVideosCount = 0;
let hasFetched = false;
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
    console.log("less video");
    console.log(`current topic is ${currentTopic}`);

    chrome.runtime.sendMessage(
      { type: "FETCH_VIDEOS", topic: currentTopic },
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
};

const observer = new MutationObserver(runCleanup);
observer.observe(document.body, {
  childList: true,
  subtree: true,
});
runCleanup();

chrome.runtime.onMessage.addListener((msg, sender, sendReponse) => {
  console.log("message arrived");
  sendReponse({ status: "Topic recevied, page will reload. " });
  return true;
});
