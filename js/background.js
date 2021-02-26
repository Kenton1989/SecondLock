import { BrowsingPageMonitor } from "./browsing-page-monitor.js";
import { LockTimeMonitor } from "./lock-timing-monitor.js";
import { ALL_OPTION_NAME, DEFAULT_OPTIONS_IN_STORAGE, OptionCollection } from "./options-manager.js";
import { blockAllTabsOf, blockPageToSelectTime } from "./tab-blocker.js";

let options = new OptionCollection(...ALL_OPTION_NAME);

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.local.get(DEFAULT_OPTIONS_IN_STORAGE, function(result){
    chrome.storage.local.set(result);
  });
});

let monitor = new BrowsingPageMonitor("browse-monitor");
let unlockTiming = new LockTimeMonitor("lock-time-monitor");

options.monitoredList.doOnUpdated(function(list){
  if (!list) return;
  monitor.blackList.reset(list);
});

function selectTime(tab, hostname) {
  console.debug(`Blocking the tab of host: ${hostname}`);
  if (unlockTiming.isUnlocked(hostname)) {
    console.debug(`${hostname} is unlocked, does not block.`);
    return;
  }
  blockPageToSelectTime(tab, hostname);
}

monitor.onBrowse.addListener(selectTime);

unlockTiming.onTimesUp.addListener(function (hostname) {
  blockAllTabsOf(hostname);
});