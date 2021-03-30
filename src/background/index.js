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
api.runtime.onInstalled.addListener(async () => {
  let result = await api.storage.local.get(DEFAULT_OPTIONS);
  api.storage.local.set(result).then(() => {
    console.debug("Setting: ", result);
  });
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

unlockTiming.onTimesUp.addListener((hostname) => {
  let type = options.timesUpPageType.getCached();
  switch (type) {
    case "none":
      tabBlocker.blockAllByClosing(hostname);
      break;
    case "default":
      tabBlocker.blockAllTabsUnder(hostname, TIME_UP_PAGE_URL);
      break;
    case "newtab":
      tabBlocker.blockAllTabsUnder(hostname, undefined);
      break;
    default:
      console.error("Unknown time's up page type:", type);
  }
});

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
