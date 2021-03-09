/**
 * This is the js for blocking.html
 */
import { DynamicPage } from "./dynamic-page.js";
import { TabBlocker } from "./tab-blocker.js";
import { closeCurrentTab, setTextForClass, $id } from "./utility.js";

let blockedHost = undefined;

let closeAllBtn = $id("close-all-about");

DynamicPage.dynamicInit(function (args) {
  blockedHost = args.blockedHost;

  setTextForClass("blocked-link", blockedHost);

  TabBlocker.autoUnblock(blockedHost);

  closeAllBtn.onclick = function () {
    TabBlocker.notifyUnblock(blockedHost);
    // Delay for a while before closing to avoid potential frequent tab switching
    window.setTimeout(closeCurrentTab, 200);
  };
});
