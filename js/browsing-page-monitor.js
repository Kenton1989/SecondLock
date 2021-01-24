import { CustomEventWrapper } from "./custom-event-wrapper.js";
import { HostnameSet } from "./hostname-set.js";
import {
  getUrlOfTab,
  validHostname,
  validIPv4Address,
  validIPv6Hostname,
} from "./utility.js";

// Different hostname type
const HOST_TYPE = {
  UNKNOWN: 0,
  NORMAL: 1,
  IPV4: 4,
  IPV6: 6,
};
Object.freeze(HOST_TYPE);

const HOSTNAME_CHARS = /^[a-z0-9:\-\.\[\]]*$/i;
/**
 * Reformat a hostname into what chrome would like to display.
 * - lowercase hostname
 * - for ip hostname, omit redundancy
 *
 * @param {String} hostname a hostname
 */
function reformat(hostname) {
  if (!HOSTNAME_CHARS.test(hostname)) return undefined;
  let url = undefined;
  try {
    url = new URL(`http://${hostname}`);
  } catch (e) {
    console.warn(e);
    return undefined;
  }
  return url.hostname;
}

const BROWSING_MONITORED_PAGE = "browsing-monitored-host";
const TAB_SWITCH_DELAY = 100;
const WINDOW_SWITCH_DELAY = 300;

/**
 * Used for monitoring browser user's browsing page.
 *
 * Client can define a list of hostname to be monitored.
 * When user start browsing a monitored hostname,
 * callback functions will be activated.
 */
class BrowsingPageMonitor {
  #monitoredHost = new HostnameSet();
  #eventTarget = new EventTarget();
  #browseEvent = new CustomEventWrapper(
    BROWSING_MONITORED_PAGE,
    this.#eventTarget
  );
  #monitoring = true;

  constructor() {
    // make private member public
    let browseEvent = this.#browseEvent;
    // avoid ambiguity of "this"
    let monitor = this;

    let onPageChanged = function (tab) {
      if (!tab.url) return;

      console.debug(`User are browsing: ${tab.url}`);

      // Check if the host is monitored
      let hostname = getUrlOfTab(tab).hostname;
      let monitoredHost = monitor.isMonitoring(hostname);
      if (monitoredHost == undefined) return;

      // Wait for a while to complete tab switch
      // to avoid some weird bugs
      window.setTimeout(function () {
        browseEvent.trigger(tab, hostname);
      }, TAB_SWITCH_DELAY);
    };

    chrome.tabs.onUpdated.addListener(function (id, changes, tab) {
      if (!monitor.active || !tab.active || !changes.url) return;
      onPageChanged(tab);
    });

    chrome.tabs.onActivated.addListener(function (tabInfo) {
      if (!monitor.active) return;
      chrome.tabs.get(tabInfo.tabId, onPageChanged);
    });

    chrome.windows.onFocusChanged.addListener(function (winId) {
      if (!monitor.active || winId == chrome.windows.WINDOW_ID_NONE) return;
      window.setTimeout(function () {
        chrome.tabs.query({ active: true, windowId: winId }, function (tabs) {
          onPageChanged(tabs[0]);
        });
      }, WINDOW_SWITCH_DELAY);
    });

    console.debug("Browsing monitor setup.");
  }

  /**
   * @returns {Boolean} If the monitor is active
   */
  get active() {
    return this.#monitoring;
  }

  set active(val) {
    val = new Boolean(val);
    this.#monitoring = val;
  }

  /**
   * Check if a hostname is monitored.
   * @param {String} hostname the hostname to be checked.
   * @returns {*} the actual monitored host suffix if the hostname is monitored.
   *    If the hostname is not monitored, return undefined
   */
  isMonitoring(hostname) {
    return this.#monitoredHost.has(hostname);
  }

  /**
   * Get a set of host name that are monitored.
   */
  get blackList() {
    return this.#monitoredHost;
  }

  /**
   * The event that will be triggered when user browse the host in blacklist.
   * 
   * The callback function format for this event is:
   *
   *     function (tab: chrome.tabs.Tab, hostname: String)
   *  - tab: the tab that opened a monitored host
   *  - hostname: the monitored hostname
   */
  get onBrowse() {
    return this.#browseEvent;
  }
}

export { BrowsingPageMonitor };
