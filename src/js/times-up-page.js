/**
 * This is the js for blocking.html
 */
import { $id } from "./common-page.js";
import { DynamicPage } from "./dynamic-page.js";
import { autoUnblock, notifyUnblock } from "./tab-blocker.js";
import { closeCurrentTab, setTextForClass } from "./utility.js";

let blockedHost = undefined;

let closeAllBtn = $id("close-all-about");

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
