import { api } from "./api";
import { CustomEventWrapper } from "./custom-event-wrapper";

const BROWSING_PAGE_CHANGED = "browsing-page-changed";

let onBrowsingPageChanged = new CustomEventWrapper(
  BROWSING_PAGE_CHANGED,
  window
);

// record latest browsing tab id to avoid potential race condition
// caused by api.tabs.onActivated & api.windows.onFocusChanged
// when user switch tab and window in one click.
let latestTab = NaN;

// If user open a new website in a tab
api.tabs.onUpdated.addListener((id, changes, tab) => {
  if (!tab.active || !changes.url) return;
  onBrowsingPageChanged.trigger(tab);
});

const NO_TAB_EXIST_MSG_PREFIX = "No tab with id";
// If user switch to another tab
api.tabs.onActivated.addListener((tabInfo) => {
  if (tabInfo.tabId === latestTab) return;
  latestTab = tabInfo.tabId;

  api.tabs
    .get(tabInfo.tabId)
    .then((tab) => tab && onBrowsingPageChanged.trigger(tab))
    .catch((reason) => {
      if (reason.message.indexOf(NO_TAB_EXIST_MSG_PREFIX) >= 0) {
        // multiple tabs are closed at the same time
      } else {
        throw reason;
      }
    });
});

// If user switch to another window
api.windows.onFocusChanged.addListener((winId) => {
  // if all window lose focus
  if (winId === api.windows.WINDOW_ID_NONE) return;

  api.tabs.query({ active: true, windowId: winId }).then((tabs) => {
    // If the all tabs are closed before query.
    if (tabs.length < 1) return;
    let tab = tabs[0];

    if (tab.id === latestTab) return;
    latestTab = tab.id;

    onBrowsingPageChanged.trigger(tab);
  });
});

export default onBrowsingPageChanged;
