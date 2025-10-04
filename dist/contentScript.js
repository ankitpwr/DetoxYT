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
const hideShortLink = () => {
    const shortsLink = document.querySelector('a[title="Shorts"]');
    if (shortsLink) {
        const parentItem = shortsLink.closest("ytd-guide-entry-renderer");
        if (parentItem) {
            console.log("found the parent item");
            parentItem.style.display = "none";
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
const hideShortsContainer = () => {
    const shortsContainer = document.querySelectorAll("ytd-rich-shelf-renderer[is-shorts]");
    console.log(shortsContainer);
    shortsContainer.forEach((container) => {
        container.style.display = "none";
    });
};
const shortsObserver = new MutationObserver(() => {
    hideShortsContainer();
});
shortsObserver.observe(document.body, {
    childList: true,
    subtree: true,
});
hideShortsContainer();


/******/ })()
;
//# sourceMappingURL=contentScript.js.map