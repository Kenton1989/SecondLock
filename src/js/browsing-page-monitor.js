import { api } from "./api.js";
import { CustomEventWrapper } from "./custom-event-wrapper.js";
import { HostnameSet } from "./hostname-set.js";
import { RemoteCallable } from "./remote-callable.js";

// Different hostname type
const HOST_TYPE = {
  UNKNOWN: 0,
  NORMAL: 1,
  IPV4: 4,
  IPV6: 6,
};
Object.freeze(HOST_TYPE);

const BROWSING_PAGE_CHANGED = "browsing-page-changed";
const BROWSING_MONITORED_PAGE = "browsing-monitored-host";
const TAB_SWITCH_DELAY = 100;
const WINDOW_SWITCH_DELAY = 300;

let onBrowsingPageChanged = new CustomEventWrapper(
  BROWSING_PAGE_CHANGED,
  window
);

// record latest browsing tab id to avoid potential race condition
// caused by api.tabs.onActivated & api.windows.onFocusChanged
// when user switch tab and window in one click.
let latestTab = NaN;

// If user open a new website in a tab
api.tabs.onUpdated.addListener(function (id, changes, tab) {
  if (!tab.active || !changes.url) return;
  onBrowsingPageChanged.trigger(tab);
});

const NO_TAB_EXIST_MSG_PREFIX = "No tab with id";
// If user switch to another tab
api.tabs.onActivated.addListener(function (tabInfo) {
  if (tabInfo.tabId == latestTab) return;
  latestTab = tabInfo.tabId;
  
  api.tabs
    .get(tabInfo.tabId)
    .then((tab) => onBrowsingPageChanged.trigger(tab))
    .catch((reason) => {
      if (reason.message.startsWith(NO_TAB_EXIST_MSG_PREFIX)) {
        // multiple tabs are closed at the same time
      } else {
        throw reason;
      }
    });
});

// If user switch to another window
api.windows.onFocusChanged.addListener(function (winId) {
  // if all window lose focus
  if (winId == api.windows.WINDOW_ID_NONE) return;

  api.tabs.query({ active: true, windowId: winId }).then((tabs) => {
    // If the all tabs are closed before query.
    if (tabs.length < 1) return;
    let tab = tabs[0];

    if (tab.id == latestTab) return;
    latestTab = tab.id;

    onBrowsingPageChanged.trigger(tab);
  });
});

/**
 * Used for monitoring browser user's browsing page.
 *
 * Client can define a list of hostname to be monitored.
 * When user start browsing a monitored hostname,
 * callback functions will be activated.
 */
class BrowsingPageMonitor extends RemoteCallable {
  constructor(name) {
    super(name);

    this._monitoredHost = new HostnameSet();
    this._whitelistHost = new HostnameSet();
    this._eventTarget = new EventTarget();
    this._browseEvent = new CustomEventWrapper(
      BROWSING_MONITORED_PAGE,
      this._eventTarget
    );
    this._monitoring = true;
    this._protocol = new Set(["http:", "https:"]);

    // shorter name
    let browseEvent = this._browseEvent;
    // avoid ambiguity of "this"
    let monitor = this;

    onBrowsingPageChanged.addListener(function (tab) {
      if (!monitor.active || !tab || !tab.url) return;

      console.debug(`User are browsing: ${tab.url}`);

      let monitoredHost = monitor.findMonitoredSuffix(tab.url);
      if (monitoredHost == undefined) return;

      // Wait for a while, to allow the browser to complete tab switching
      // to reduce the effect of a weird bug
      window.setTimeout(function () {
        browseEvent.trigger(tab, monitoredHost);
      }, TAB_SWITCH_DELAY);
    });

    console.debug("Browsing monitor setup.");
  }

  /**
   * @return {Set<String>} the protocol that are monitored
   */
  get monitoredProtocol() {
    return this._protocol;
  }

  /**
   * @returns {boolean} If the monitor is active
   */
  get active() {
    return this._monitoring;
  }

  set active(val) {
    val = Boolean(val);
    this._monitoring = val;
  }

  /**
   * find the actual monitored suffix.
   * @param {string} url the URL of web page to be checked.
   * @returns {(string|undefined)} the actual monitored host suffix if the web page is monitored.
   *    If the web page is not monitored, return undefined
   */
  findMonitoredSuffix(url) {
    if (!this.active) return undefined;
    let urlObj = new URL(url);
    if (!this.monitoredProtocol.has(urlObj.protocol)) return undefined;
    if (this.whitelist.has(urlObj.hostname)) return undefined;
    return this.blacklist.findSuffix(urlObj.hostname);
  }

  /**
   * Check if a web page is monitored.
   * @param {string} url the URL of web page to be checked.
   * @returns {boolean} true if the tab is monitored
   */
  isMonitoring(url) {
    if (!this.active) return undefined;
    let urlObj = new URL(url);
    if (!this.monitoredProtocol.has(urlObj.protocol)) return undefined;
    if (this.whitelist.has(urlObj.hostname)) return undefined;
    return this.blacklist.has(urlObj.hostname);
  }

  /**
   * Get a set of host name that are monitored.
   */
  get blacklist() {
    return this._monitoredHost;
  }

  /**
   * Get a set of host name that are in the whitelist.
   */
  get whitelist() {
    return this._whitelistHost;
  }

  /**
   * The event that will be triggered when user browse the host in blacklist.
   *
   * The callback function format for this event is:
   *
   *     function (tab: api.tabs.Tab, hostname: String)
   *
   *  - tab: the tab that opened a monitored host
   *  - hostname: the monitored hostname
   */
  get onBrowse() {
    return this._browseEvent;
  }

  /**
   * A event that will be triggered whenever user browsing new page.
   *
   * The callback function format for this event is:
   *
   *      function (tab: api.tabs.Tab)
   *
   *  - tab: the tab that are current visiting
   */
  static get onBrowsingPageChanged() {
    return onBrowsingPageChanged;
  }
}

export { BrowsingPageMonitor };
