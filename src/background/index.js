import { BrowsingPageMonitor } from "./browsing-page-monitor";
import { DynamicPageBackend } from "./dynamic-page-backend";
import { HostTimingMonitor } from "./host-timing-monitor";
import {
  ALL_OPTION_NAME,
  DEFAULT_OPTIONS,
  OptionCollection,
} from "../common/options-manager.js";
import RemoteCallable from "../common/remote-callable";
import { TabBlocker } from "../common/tab-blocker";
import { api } from "../common/api";
import { closeTabs } from "../common/utility";

let options = new OptionCollection(...ALL_OPTION_NAME);

const SELECT_DUR_PAGE_URL = api.runtime.getURL("select-time.html");
const TIME_UP_PAGE_URL = api.runtime.getURL("times-up.html");

// Set default options
api.runtime.onInstalled.addListener(function () {
  api.storage.local.get(DEFAULT_OPTIONS).then(function (result) {
    api.storage.local.set(result).then(function () {
      console.debug("Setting: ", result);
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

options.leaveOneTab.doOnUpdated((val) => {
  tabBlocker.keepOneTab = val;
});

function blockToSelectTime(tab, hostname) {
  console.debug(`Blocking the tab of host: ${hostname}`);
  if (unlockTiming.isTiming(hostname)) {
    console.debug(`${hostname} is unlocked, does not block.`);
    return;
  }
  tabBlocker.blockPageWithNewTab(tab, hostname, SELECT_DUR_PAGE_URL);
}

monitor.onBrowse.addListener(blockToSelectTime);

unlockTiming.onTimesUp.addListener(function (hostname) {
  tabBlocker.blockAllTabsUnder(hostname, TIME_UP_PAGE_URL);
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
    if (unlockEndTime !== undefined) {
      state.isUnlocked = true;
      state.unlockEndTime = unlockEndTime;
    }

    let calmDownEndTime = calmDownTiming.endTimePoint(actualMonitored);
    if (calmDownEndTime !== undefined) {
      state.needCalmDown = true;
      state.calmDownEndTime = calmDownEndTime;
    }
  }
  return state;
};

backgroundAux.stopTimingAndClose = function (hostname) {
  tabBlocker.blockAllByClosing(hostname).then(function () {
    // stop timing after closing
    // avoid frequent tabs switching,
    // which is likely to trigger browsing monitor unexpectedly
    unlockTiming.stopTiming(hostname);
  });
};

const CANDIDATE_RELATIVE_URL = [TIME_UP_PAGE_URL, SELECT_DUR_PAGE_URL];
backgroundAux.closeRelativePages = function (hostname) {
  tabBlocker
    .blockAllByClosing(hostname)
    .then(() => {
      return api.tabs.query({ url: CANDIDATE_RELATIVE_URL });
    })
    .then((toClose) => {
      toClose = toClose.filter(
        (tab) => dynamicPageBack.getParam(tab.id).blockedHost === hostname
      );
      closeTabs(toClose, true);
    });
};
