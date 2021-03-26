/**
 * This is the js for blocking.html
 */
import { dynamicInit } from "./dynamic-page";
import { TabBlocker } from "./tab-blocker";
import { setTextForClass, $id } from "../../common/utility";
import "./common-page";
import { RemoteCallable } from "../../common/remote-callable"
import { OptionCollection } from "./options-manager";

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
