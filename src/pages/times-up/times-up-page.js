/**
 * This is the js for blocking.html
 */
import { dynamicInit } from "./dynamic-page.js";
import { TabBlocker } from "./tab-blocker.js";
import { setTextForClass, $id } from "../../common/utility.js";
import "./common-page.js";
import { RemoteCallable } from "../../common/remote-callable.js"
import { OptionCollection } from "./options-manager.js";

let blockedHost = undefined;
let options = new OptionCollection("mottos");

let closeAllBtn = $id("close-all-about");

dynamicInit(function (args) {
  blockedHost = args.blockedHost;

  setTextForClass("blocked-link", blockedHost);

  TabBlocker.autoUnblock(blockedHost);

  closeAllBtn.onclick = function () {
    // close all page about the hostname
    RemoteCallable.call("background-aux", "closeRelativePages", [blockedHost]);
  };
});

{
  let mottoTxt = $id("motto-txt");
  options.mottos.doOnUpdated((mottos) => {
    mottoTxt.innerText = mottos[0];
  });
}
