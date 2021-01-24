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

/**
 * Used for monitoring browser user's browsing page.
 * 
 * Client can define a list of hostname to be monitored.
 * When user start browsing a monitored hostname, 
 * callback functions will be activated.
 */
class BrowsingPageMonitor {
  static #MONITORED_PAGE_ACTIVE = "monitored-page-active";
  #monitoredHost = new HostnameSet();
  #eventTarget = new EventTarget();
  #monitoring = true;

  constructor() {
    // make private member public
    let eventTarget = this.#eventTarget;
    // avoid ambiguity of "this"
    let monitor = this;

    let onPageChanged = function (tab) {
      if (!tab.url) return;

      console.debug(`User are browsing: ${tab.url}`);
      
      // Check if the host is monitored
      let hostname = getUrlOfTab(tab).hostname;
      let result = monitor.isMonitoring(hostname);
      if (result == undefined) return;

      // prepare for event dispatching
      let monitoredHost = result;
      let event = new CustomEvent(BrowsingPageMonitor.#MONITORED_PAGE_ACTIVE, {
        detail: { tab: tab, hostname: monitoredHost },
      });

      // Wait for a while to complete tab switch
      // To avoid some weird bugs
      window.setTimeout(function () {
        eventTarget.dispatchEvent(event);
      }, 100);
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
      }, 200);
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
   * Add a callback function when a web page switch to a monitored host.
   * @param {function(chrome.tabs.Tab, String)} callback
   * -- param1: the tab which accessed the monitored hostname,
   * - param2: the monitored hostname.
   */
  addReaction(callback) {
    this.#eventTarget.addEventListener(
      BrowsingPageMonitor.#MONITORED_PAGE_ACTIVE,
      function (e) {
        callback(e.detail.tab, e.detail.hostname);
      }
    );
  }
}

export { BrowsingPageMonitor };
