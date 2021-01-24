import { getUrlOfTab } from "./utility.js";
import { DynamicPageBackend } from "./dynamic-page-backend.js";
import { BrowsingPageMonitor } from "./browsing-page-monitor.js";

const kSelectTimeURL = chrome.runtime.getURL("select-time.html");
const kBlockPageURL = chrome.runtime.getURL("blocking.html");
const kOptionURL = chrome.runtime.getURL("options.html");


var activated = true;

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ activated: false }, function () {
    console.log("Lock is activated");
  });
});

chrome.storage.sync.get("activated", function (data) {
  activated = data.activated;
  console.log("Init activated: " + data.activated);
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (changes.activated != undefined) {
    activated = changes.activated.newValue;
    console.log("background buffered activated changed: " + activated);
  }
});

function shouldBlock(tab) {
  if (!activated) {
    return false;
  }
  var url = getUrlOfTab(tab);
  if (!kBlackListProtocol.has(url.protocol)) {
    console.log("Protocol not in black list");
    return false;
  }
  return true;
}

let monitor = new BrowsingPageMonitor();
let blackList = ["bilibili.com", "www.youtube.com", "localhost"];
monitor.addMonitoredHostList(blackList);

function blockTab(tab, hostname) {
  console.log("Blocking the tab");
  DynamicPageBackend.openOnNewTab(kBlockPageURL, {blocked_link: hostname});
}

monitor.addReaction(blockTab);
