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
const hideElement = (selector) => {
    if (selector == SELECTORS.shorts.shelf) {
        const elements = document.querySelectorAll(selector);
        if (elements) {
            elements.forEach((container) => {
                if (container.style.display != "none")
                    container.style.display = "none";
            });
        }
    }
    else {
        const element = document.querySelector(selector);
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


/******/ })()
;
//# sourceMappingURL=contentScript.js.map