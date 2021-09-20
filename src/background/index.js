import { BrowsingPageMonitor } from "./browsing-page-monitor";
import { DynamicPageBackend } from "./dynamic-page-backend";
import { HostTimingMonitor } from "./host-timing-monitor";
import {
  ALL_OPTION_NAME,
  DEFAULT_OPTIONS,
  DEFAULT_SHARED_OPTIONS,
  OptionCollection,
} from "../common/options-manager.js";
import RemoteCallable from "../common/remote-callable";
import { TabBlocker } from "./tab-blocker";
import { api } from "../common/api";
import { closeTabs } from "../common/utility";

let options = new OptionCollection(...ALL_OPTION_NAME);

const SELECT_DUR_PAGE_URL = api.runtime.getURL("select-time.html");
const TIME_UP_PAGE_URL = api.runtime.getURL("times-up.html");

// Set default options
api.runtime.onInstalled.addListener(async () => {
  let localResult = await api.storage.local.get(DEFAULT_OPTIONS);
  api.storage.local.set(localResult);
  console.debug("local storage initialized:", localResult);

  let syncResult = await api.storage.sync.get(DEFAULT_SHARED_OPTIONS);
  api.storage.sync.set(syncResult);
  console.debug("sync storage initialized:", syncResult);
});

let dynamicPageBack = new DynamicPageBackend("dynamic-page-backend");
let monitor = new BrowsingPageMonitor("browse-monitor");
let unlockTiming = new HostTimingMonitor("lock-time-monitor");
let calmDownTiming = new HostTimingMonitor("calm-down-time-monitor");
let tabBlocker = new TabBlocker("tab-blocker", dynamicPageBack, monitor);
let backgroundAux = new RemoteCallable("background-aux");

options.monitoredList.doOnUpdated((list) => {
  if (!list) return;
  monitor.blacklist.reset(list);
});

options.whitelistHost.doOnUpdated((list) => {
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

// handling times up event
{
  // default blocking function
  function defaultBlocker() { console.error("blocker on times up is not set."); }
  
  // blocking function
  let blockingOnTimesUp = defaultBlocker;
  
  options.timesUpPageType.doOnUpdated((type) => {
    switch (type) {
      case "none":
        blockingOnTimesUp = (hostname) => tabBlocker.blockAllByClosing(hostname);
        break;
      case "default":
        blockingOnTimesUp = (hostname) =>
          tabBlocker.blockAllTabsUnder(hostname, TIME_UP_PAGE_URL);
        break;
      case "newtab":
        blockingOnTimesUp = (hostname) =>
          tabBlocker.blockAllTabsUnder(hostname, undefined);
        break;
      default:
        blockingOnTimesUp = defaultBlocker;
        console.error("Unknown time's up page type:", type);
    }
  })
  
  // cannot use xxx.addListener(blockingOnTimesUp) directly.
  // otherwise the blocker will not be updated correctly
  unlockTiming.onTimesUp.addListener((hostname) => {
    blockingOnTimesUp(hostname);
  });
}

backgroundAux.queryPageState = (url) => {
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

backgroundAux.stopTimingAndClose = (hostname) => {
  tabBlocker.blockAllByClosing(hostname).then(() => {
    // stop timing after closing
    // avoid frequent tabs switching,
    // which is likely to trigger browsing monitor unexpectedly
    unlockTiming.stopTiming(hostname);
  });
};

const CANDIDATE_RELATIVE_URL = [TIME_UP_PAGE_URL, SELECT_DUR_PAGE_URL];

backgroundAux.closeExtPageAbout = async (hostname) => {
  let toClose = await api.tabs.query({ url: CANDIDATE_RELATIVE_URL });
  toClose = toClose.filter(
    (tab) => dynamicPageBack.getParam(tab.id).blockedHost === hostname
  );
  await closeTabs(toClose, true);
};

backgroundAux.closeRelativePages = async (hostname) => {
  await tabBlocker.blockAllByClosing(hostname);
  await backgroundAux.closeExtPageAbout(hostname);
};
