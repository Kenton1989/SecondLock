import {} from "./common-page.js";
import { DynamicPage } from "./dynamic-page.js";
import { autoUnblock, notifyUnblock } from "./tab-blocker.js";
import { closeCurrentTab, setTextForClass } from "./utility.js";

let blockedHost = undefined;

function doOnLoaded() {
  let closeAllBtn = document.getElementById("close-all-about");
  
  DynamicPage.dynamicInit(function (args) {
    blockedHost = args.blockedHost;
    
    setTextForClass("blocked-link", blockedHost);
    
    autoUnblock(blockedHost);

    closeAllBtn.onclick = function () {
      notifyUnblock(blockedHost);
      closeCurrentTab();
    };
  });
}

window.addEventListener("load", doOnLoaded);
