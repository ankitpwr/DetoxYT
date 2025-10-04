const hideYTShorts = () => {
  //hiding shorts button
  const shortsLink = document.querySelector('a[title="Shorts"]');
  if (shortsLink) {
    const parentItem = shortsLink.closest("ytd-guide-entry-renderer");
    if (parentItem) {
      console.log("found the parent item");
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
