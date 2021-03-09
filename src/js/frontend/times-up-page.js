/**
 * This is the js for blocking.html
 */
import {} from "/js/frontend/common-page.js";
import { DynamicPage } from "/js/dynamic-page.js";
import { autoUnblock, notifyUnblock } from "/js/tab-blocker.js";
import { closeCurrentTab, setTextForClass } from "/js/utility.js";

let blockedHost = undefined;

let closeAllBtn = document.getElementById("close-all-about");

DynamicPage.dynamicInit(function (args) {
  blockedHost = args.blockedHost;

  setTextForClass("blocked-link", blockedHost);

  autoUnblock(blockedHost);

  closeAllBtn.onclick = function () {
    notifyUnblock(blockedHost);
    // Delay for a while before closing to avoid potential frequent tab switching
    window.setTimeout(closeCurrentTab, 200);
  };
});
