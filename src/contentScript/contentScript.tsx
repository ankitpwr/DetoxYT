const hideShortLink = () => {
  console.log("inside hideshort link");
  const shortsLink = document.querySelector('a[title="Shorts"]');
  if (shortsLink) {
    const parentItem = shortsLink.closest("ytd-guide-entry-renderer");
    if (parentItem) {
      console.log("found the parent item");
      (parentItem as HTMLElement).style.display = "none";
      return true;
    }
  }
  return false;
};
const observer = new MutationObserver(() => {
  // watch DOM changes
  if (hideShortLink()) {
    observer.disconnect();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
hideShortLink();
