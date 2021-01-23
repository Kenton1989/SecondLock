import {
  getUrlOfTab,
  validHostname,
  validIPv4Address,
  validIPv6Hostname,
} from "./utility.js";

const HOST_TYPE = {
  UNKNOWN: 0,
  NORMAL: 1,
  IPV4: 4,
  IPV6: 6,
};
Object.freeze(HOST_TYPE);

class PageMonitor {
  static #HOSTNAME_CHARS = /^[a-z0-9:\-\.\[\]]*$/i;
  static #MONITORED_PAGE_ACTIVE = "monitored-page-active";
  #monitoredHost = new Map();
  #matchingRegex = /$^/;
  #eventTarget = new EventTarget();

  constructor() {
    let onPageChanged = this.#onPageChanged;

    chrome.tabs.onUpdated.addListener(function (id, changes, tab) {
      if (!tab.active || !changes.url || !tab.url) return;
      onPageChanged(tab);
    });

    chrome.tabs.onActivated.addListener(function (tabInfo) {
      chrome.tabs.get(tabInfo.tabId, onPageChanged);
    });

    chrome.windows.onFocusChanged.addListener(function (winId) {
      if (winId == chrome.windows.WINDOW_ID_NONE) return;
      window.setTimeout(function () {
        chrome.tabs.query({ active: true, windowId: winId }, function (tabs) {
          onPageChanged(tabs[0]);
        });
      }, 200);
    });
  }

  /**
   * The number of hostname being monitored.
   */
  get monitoredCount() {
    return this.#monitoredHost.size;
  }

  /**
   * Check if a hostname is monitored.
   * @param {String} hostname the hostname to be checked.
   * @returns {boolean} true if the hostname is monitored.
   */
  hasMonitoredHost(hostname) {
    return this.#monitoredHost.has(hostname);
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
      PageMonitor.#MONITORED_PAGE_ACTIVE,
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
    let formattedHost = PageMonitor.#reformat(hostname);
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
    let formattedHost = PageMonitor.#reformat(hostname);
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
        pattern += `|((.*\\.)?${pair[0]}$)`;
      } else {
        // Exact match
        pattern += `|(^${pair[0]}$)`;
      }
    }

    this.#matchingRegex = new RegExp(pattern, "i");
  }

  #onPageChanged(tab) {
    // Check if the host is monitored
    let hostname = getUrlOfTab(tab).hostname;
    let result = this.#matchingRegex.exec(hostname);
    if (!result) return;

    // prepare for event dispatching
    let monitoredHost = result[0];
    let eventTarget = this.#eventTarget;
    let event = new CustomEvent(PageMonitor.#MONITORED_PAGE_ACTIVE, {
      detail: { tab: tab, hostname: monitoredHost },
    });
    
    // Wait for a wait to complete tab switch
    // To avoid some weird bugs
    window.setTimeout(function () {
      eventTarget.dispatchEvent(event);
    }, 100);
  }

  /**
   * Reformat a hostname into what chrome would like to display.
   * - lowercase hostname
   * - for ip hostname, omit redundancy
   *
   * @param {String} hostname a hostname
   */
  static #reformat(hostname) {
    if (!PageMonitor.#HOSTNAME_CHARS.test(url)) return undefined;
    let url = undefined;
    try {
      url = new URL(`http://${hostname}`);
    } catch (e) {
      console.warn(e);
      return undefined;
    }
    return url.hostname;
  }
}

export { PageMonitor };
