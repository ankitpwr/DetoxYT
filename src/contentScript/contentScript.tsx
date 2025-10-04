const hideYTShorts = () => {
  //hiding shorts button
  const shortsLink = document.querySelector('a[title="Shorts"]');
  if (shortsLink) {
    const parentItem = shortsLink.closest("ytd-guide-entry-renderer");
    if (parentItem) {
      (parentItem as HTMLElement).style.display = "none";
    }
  }

  // hiding shorts container
  const shortsContainer = document.querySelectorAll(
    "ytd-rich-shelf-renderer[is-shorts]"
  );

  shortsContainer.forEach((container) => {
    (container as HTMLElement).style.display = "none";
  });
};

// observe DOM
const observer = new MutationObserver(() => {
  hideYTShorts();
});
hideYTShorts();

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

const hideSideBar = (containerName: string) => {
  const sideBarContainer = document.querySelector(containerName);
  if (sideBarContainer) {
    (sideBarContainer as HTMLElement).style.display = "none";
    return true;
  }
  return false;
};

// observe DOM
const SiderBarobserver = new MutationObserver(() => {
  let hideMainSideBar = false;
  let hideMiniSideBar = false;
  if (hideSideBar("ytd-guide-renderer")) {
    console.log("found sidebar");
    hideMainSideBar = true;
  }
  if (hideSideBar("ytd-mini-guide-renderer")) {
    console.log("found mini side bar");
    hideMiniSideBar = true;
  }
  if (hideMainSideBar && hideMiniSideBar) {
    console.log("closing SiderBarobserver");
    SiderBarobserver.disconnect();
  }
});

SiderBarobserver.observe(document.body, {
  childList: true,
  subtree: true,
});
