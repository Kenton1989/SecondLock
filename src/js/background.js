import { BrowsingPageMonitor } from "./browsing-page-monitor.js";
import { DynamicPageBackend } from "./dynamic-page-backend.js";
import { HostTimingMonitor } from "./host-timing-monitor.js";
import {
  ALL_OPTION_NAME,
  DEFAULT_OPTIONS,
  OptionCollection,
} from "./options-manager.js";
import { RemoteCallable } from "./remote-callable.js";
import { TabBlocker } from "./tab-blocker.js";
import { api } from "./api.js";

let options = new OptionCollection(...ALL_OPTION_NAME);

const kSelectTimeURL = api.runtime.getURL("select-time.html");
const kTimesUpPageURL = api.runtime.getURL("times-up.html");

// Set default options
api.runtime.onInstalled.addListener(function () {
  api.storage.local.get(DEFAULT_OPTIONS).then(function (result) {
    api.storage.local.set(result).then(function () {
      console.debug("Setting: ", result)
    });
  });
});

let dynamicPageBack = new DynamicPageBackend("dynamic-page-backend");
let monitor = new BrowsingPageMonitor("browse-monitor");
let unlockTiming = new HostTimingMonitor("lock-time-monitor");
let calmDownTiming = new HostTimingMonitor("calm-down-time-monitor");
let tabBlocker = new TabBlocker("tab-blocker", dynamicPageBack, monitor);
let backgroundAux = new RemoteCallable("background-aux");

options.monitoredList.doOnUpdated(function (list) {
  if (!list) return;
  monitor.blacklist.reset(list);
});

options.whitelistHost.doOnUpdated(function (list) {
  if (!list) return;
  monitor.whitelist.reset(list);
});

function selectTime(tab, hostname) {
  console.debug(`Blocking the tab of host: ${hostname}`);
  if (unlockTiming.isTiming(hostname)) {
    console.debug(`${hostname} is unlocked, does not block.`);
    return;
  }
  tabBlocker.blockPageWithNewTab(tab, hostname, kSelectTimeURL);
}

monitor.onBrowse.addListener(selectTime);

unlockTiming.onTimesUp.addListener(function (hostname) {
  tabBlocker.blockAllTabsUnder(hostname, kTimesUpPageURL);
});

backgroundAux.queryPageState = function (url) {
  let state = {
    isMonitored: false,
    monitoredHost: undefined,
    isUnlocked: undefined,
    unlockEndTime: undefined,
    needCalmDown: undefined,
    calmDownEndTime: undefined,
  };

  let actualMonitored = monitor.findMonitoredSuffix(url);
  if (actualMonitored) {
    state.isMonitored = true;
    state.monitoredHost = actualMonitored;

    let unlockEndTime = unlockTiming.endTimePoint(actualMonitored);
    if (unlockEndTime != undefined) {
      state.isUnlocked = true;
      state.unlockEndTime = unlockEndTime;
    }

    let calmDownEndTime = calmDownTiming.endTimePoint(actualMonitored);
    if (calmDownEndTime != undefined) {
      state.needCalmDown = true;
      state.calmDownEndTime = calmDownEndTime;
    }
  }
  return state;
};

backgroundAux.stopTimingAndClose = function (hostname) {
  tabBlocker.blockAllByClosing(hostname).then(function () {
    // stop timing after closing
    // avoid frequent tabs switching, which is likely to trigger browsing-monitor
    unlockTiming.stopTiming(hostname);
  });
};
