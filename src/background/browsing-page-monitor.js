import { CustomEventWrapper } from "../common/custom-event-wrapper";
import HostnameSet from "../common/hostname-set";
import RemoteCallable from "../common/remote-callable";
import onBrowsingPageChanged from "../common/browsing-page-change-event";

// Different hostname type
const HOST_TYPE = {
  UNKNOWN: 0,
  NORMAL: 1,
  IPV4: 4,
  IPV6: 6,
};
Object.freeze(HOST_TYPE);

const BROWSING_MONITORED_PAGE = "browsing-monitored-host";
const TAB_SWITCH_DELAY = 100;

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
      if (monitoredHost === undefined) return;

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
