/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!*********************************************!*\
  !*** ./src/contentScript/contentScript.tsx ***!
  \*********************************************/
__webpack_require__.r(__webpack_exports__);
const hideYTShorts = () => {
    //hiding shorts button
    const shortsLink = document.querySelector('a[title="Shorts"]');
    if (shortsLink) {
        const parentItem = shortsLink.closest("ytd-guide-entry-renderer");
        if (parentItem) {
            parentItem.style.display = "none";
        }
    }
    // hiding shorts container
    const shortsContainer = document.querySelectorAll("ytd-rich-shelf-renderer[is-shorts]");
    shortsContainer.forEach((container) => {
        container.style.display = "none";
    });
};
hideYTShorts();
const hideSideBar = (containerName) => {
    const sideBarContainer = document.querySelector(containerName);
    const filterbar = document.querySelector("iron-selector");
    if (filterbar) {
        filterbar.style.display = "none";
    }
    if (sideBarContainer) {
        sideBarContainer.style.display = "none";
        return true;
    }
    return false;
};
const hideSecondarySideBar = () => {
    const secondarySideBar = document.querySelector("ytd-watch-next-secondary-results-renderer");
    if (secondarySideBar) {
        secondarySideBar.style.display = "none";
    }
};
// observe DOM
const observer = new MutationObserver(() => {
    hideYTShorts();
});
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
const sideBarInsideVideo = new MutationObserver(() => {
    hideSecondarySideBar();
});
observer.observe(document.body, {
    childList: true,
    subtree: true,
});
SiderBarobserver.observe(document.body, {
    childList: true,
    subtree: true,
});
sideBarInsideVideo.observe(document.body, {
    childList: true,
    subtree: true,
});


/******/ })()
;
//# sourceMappingURL=contentScript.js.map