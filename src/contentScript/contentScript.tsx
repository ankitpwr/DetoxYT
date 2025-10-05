let currentTopic = "";
chrome.storage.sync.get(["topic"], (result) => {
  if (result) {
    currentTopic = result.topic;
    console.log(currentTopic);
    runCleanup();
  }
});

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
        console.log(`current topic is ${currentTopic}`);
        if (!title.toLowerCase().includes(currentTopic.toLowerCase())) {
          (container as HTMLElement).style.display = "none";
        }
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
};

const observer = new MutationObserver(runCleanup);
observer.observe(document.body, {
  childList: true,
  subtree: true,
});
runCleanup();

chrome.runtime.onMessage.addListener((msg, sender, sendReponse) => {
  console.log("incomming message");
  console.log(JSON.parse(msg));
  console.log(sender);
  console.log(sendReponse);
  console.log("message end");
  if (msg.topic && msg.topic != "") {
    currentTopic = msg.topic;
    chrome.tabs.reload();
    runCleanup();
  }
});
