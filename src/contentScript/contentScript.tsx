const SELECTORS = {
  shorts: {
    sidebarLink: 'a[title="Shorts]',
    shelf: "ytd-rich-shelf-renderer[is-shorts]",
  },
  sidebars: {
    main: "ytd-guide-renderer",
    mini: "ytd-mini-guide-renderer",
    secondary: "ytd-watch-next-secondary-results-renderer",
    topicFilters: "iron-selector",
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
};

const observer = new MutationObserver(runCleanup);
observer.observe(document.body, {
  childList: true,
  subtree: true,
});
runCleanup();
