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
  #monitoredHost = new Map();
  #matchingRegex = /$^/;
  #eventTarget = new EventTarget();
  #monitoring = true;

  constructor() {
    // make private member public
    let eventTarget = this.#eventTarget;
    // avoid ambiguity of "this"
    let monitor = this;

    let onPageChanged = function (tab) {
      if (!tab.url) return;
      
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

    console.log("Browsing monitor setup.");
  }

  /**
   * The number of hostname being monitored.
   */
  get monitoredCount() {
    return this.#monitoredHost.size;
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
    hostname = reformat(hostname);
    if (!hostname) return undefined;

    let result = this.#matchingRegex.exec(hostname);
    if (!result) return undefined;

    return result[0];
  }

  /**
   * Add a hostname to be monitored.
   * @param {String} hostname the hostname to be monitored
   * @returns {boolean} true if successfully added. If the hostname is invalid or
   *          the hostname is already existed, return false.
   */
  addMonitoredHost(hostname) {
    if (!this.#addToMap(hostname)) return false;

    this.#updateRegex();
  }

  /**
   * Remove a list of hostname to be monitored.
   * @param {String[]} hostnameList the list of hostname to be monitored
   */
  addMonitoredHostList(hostnameList) {
    let dirty = false;
    for (const val of hostnameList) {
      dirty = this.#addToMap(val) || dirty;
    }
    if (!dirty) return;

    this.#updateRegex();
  }

  /**
   * Remove a hostname from the monitored list.
   * @param {String} hostname the hostname to be removed.
   * @return {boolean} true if the hostname exist in the list and being removed.
   */
  removeMonitoredHost(hostname) {
    if (!this.hasMonitoredHost(hostname)) return;

    this.#updateRegex();
  }

  /**
   * Remove a list of hostname to be monitored.
   * @param {String[]} hostnameList the list of hostname to be monitored
   */
  removeMonitoredHostList(hostnameList) {
    let dirty = false;
    for (const val of hostnameList) {
      dirty = this.#removeFromMap(val) || dirty;
    }
    if (!dirty) return;

    this.#updateRegex();
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

  /**
   * add a hostname into map, without updating matcher.
   * @param {String} hostname a hostname
   * @returns {boolean} true if a hostname is successfully added.
   */
  #addToMap(hostname) {
    let formattedHost = reformat(hostname);
    if (!formattedHost) {
      console.warn(`Invalid hostname: ${hostname}`);
      return false;
    }
    if (this.#monitoredHost.has(formattedHost)) return false;

    if (validHostname(formattedHost)) {
      this.#monitoredHost.set(formattedHost, HOST_TYPE.NORMAL);
    } else if (validIPv4Address(formattedHost)) {
      this.#monitoredHost.set(formattedHost, HOST_TYPE.IPV4);
    } else if (validIPv6Hostname(formattedHost)) {
      this.#monitoredHost.set(formattedHost, HOST_TYPE.IPV6);
    } else {
      console.warn(`Invalid hostname: ${hostname}`);
      return false;
    }

    return true;
  }

  /**
   * remove a hostname from map, without updating matcher.
   * @param {String} hostname a hostname
   * @returns {boolean} true if a hostname is removed from the map
   */
  #removeFromMap(hostname) {
    let formattedHost = reformat(hostname);
    if (!formattedHost) {
      console.warn(`Invalid hostname: ${hostname}`);
      return false;
    }
    return this.#monitoredHost.delete(hostname);
  }

  /**
   * Update the regex matcher for hostname.
   */
  #updateRegex() {
    // initialized with an impossible pattern.
    let pattern = "($^)";

    for (const pair of this.#monitoredHost) {
      if (pair[1] == HOST_TYPE.NORMAL) {
        // Match suffix
        pattern += `|((^|\\.)(${pair[0]})$)`;
      } else {
        // Exact match
        pattern += `|(^${pair[0]}$)`;
      }
    }

    this.#matchingRegex = new RegExp(pattern, "i");
  }
}

export { BrowsingPageMonitor };
