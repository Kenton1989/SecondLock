import { api } from "./api";
import { RemoteCallable } from "./remote-callable";
import {
  closeCurrentTab,
  queryTabsUnder,
  validHostname,
  closeTabs,
} from "./utility.js";

const NO_RESPONSE_MSG =
  "The message port closed before a response was received.";
class TabBlocker extends RemoteCallable {
  /**
   * Create a tab blocker backing with the given dynamic page backend and monitor
   *
   * @param {string} name the name as an remote callable
   * @param {DynamicPageBackend} backend the dynamic page backend used to open blocking page
   * @param {BrowsingPageMonitor} monitor the monitor used to verify if the blocking is valid
   */
  constructor(name, backend, monitor) {
    super(name);
    this._backend = backend;
    this._monitor = monitor;
    this._leaveOneWhenCloseAll = true;
  }

  /**
   * @returns {boolean} whether a New Tab page is open when all tabs in active window are closed
   */
  get keepOneTab() {
    return this._leaveOneWhenCloseAll;
  }

  set keepOneTab(val) {
    this._leaveOneWhenCloseAll = Boolean(val);
  }

  /**
   * Block a tab by opening a new tab in the same window.
   *
   * @param {api.tabs.Tab} tab the tab to be blocked.
   * @param {string} hostname the hostname to be blocked.
   * @param {(string|undefined)} blockingPageUrl the URL of the new page used for blocking,
   *     if it is undefined, a New Tab page will be created
   * @returns {Promise<api.tabs.Tab>}  The promise resolved with newly created tab
   *  after the blocking tab is created
   */
  blockPageWithNewTab(tab, hostname, blockingPageUrl) {
    if (blockingPageUrl) {
      return this._backend.openOnNewTab(
        blockingPageUrl,
        { blockedHost: hostname, blockedTabId: tab.id },
        { windowId: tab.windowId }
      );
    } else {
      return api.tabs.create({ windowId: tab.windowId });
    }
  }

  /**
   * Block the content of a tab completely with given page and parameters.
   *
   * @param {api.tabs.Tab} tab the tab on which the host is accessed.
   * @param {String} hostname the hostname to be blocked.
   * @param {String} newPageUrl the url of page used to override existing page.
   *  Assuming the page is dynamic page.
   * @param {*} param the param passed to dynamic page
   * @returns {Promise<api.tabs.Tab>} promise resolved with updated tab object
   * after the tab is blocked
   */
  blockPageByOverwriting(tab, hostname, newPageUrl, param = {}) {
    param.blockedHost = hostname;
    return this._backend.openOnExistingTab(newPageUrl, param, tab.id);
  }

  /**
   * Block all tabs under the given hostname, unless the hostname is not monitored by monitor
   *
   * @param {string} hostname the hostname to be blocked
   * @param {string} blockingPageUrl the URL of new page used to block the tab. All active
   *  tabs will be blocked with blockingPageUrl through method this.blockPageWithNewTab
   */
  blockAllTabsUnder(hostname, blockingPageUrl) {
    // make private member visible
    let monitor = this._monitor;
    let blocker = this;

    queryTabsUnder(hostname, { active: true })
      .then((tabs) => {
        for (const tab of tabs) {
          if (monitor.isMonitoring(tab.url))
            blocker.blockPageWithNewTab(tab, hostname, blockingPageUrl);
        }
      })
      .then(() => {
        return queryTabsUnder(hostname, { active: false });
      })
      .then((tabs) => {
        let toClose = tabs.filter((tab) => monitor.isMonitoring(tab.url));
        closeTabs(toClose);
      });
  }

  /**
   * Block all the page opening the given hostname by closing all page.
   * Whitelist of monitor will be checked before closing
   * @param {string} hostname the hostname to be blocked
   * @param {boolean} leaveOneTab whether a new tab should be opened on the top window
   *  if all tabs on the top window are closed. The default value follows this.keepOneTab
   * @returns {Promise<undefined>} the promise resolved with undefined after all tabs are closed
   */
  async blockAllByClosing(hostname, leaveOneTab = this.keepOneTab) {
    let monitor = this._monitor;
    let toClose = await queryTabsUnder(hostname);

    toClose = toClose.filter((tab) => monitor.isMonitoring(tab.url));

    // temporary disable the monitor
    // since frequent tabs switching may happen when multiple tabs are close
    // which is likely to the trigger monitor unexpectedly
    let oldActive = monitor.active;
    monitor.active = false;

    await closeTabs(toClose, leaveOneTab);

    monitor.active = oldActive;
  }

  /**
   * Notify all tabs that are blocking the given hostname to unblock,
   * **except the current page**.
   *
   * To let a tab automatically close itself after this function is called,
   * autoBlock(hostname: string) should be called in the content-script of
   * that page.
   *
   * @param {String} hostname the hostname to be unblocked.
   */
  static notifyUnblock(hostname) {
    api.runtime
      .sendMessage({
        doNotBlockHost: hostname,
      })
      .catch(function (reason) {
        // this method does not expect any response
        if (reason.message !== NO_RESPONSE_MSG) {
          throw reason;
        }
      });
  }

  /**
   * [For content script] Auto unblock the given page
   * when the given tab should be unblocked.
   *
   * @param {String} hostname the hostname to be unblocked.
   */
  static autoUnblock(hostname) {
    if (!hostname) return;
    api.runtime.onMessage.addListener(function (message) {
      if (message.doNotBlockHost) {
        let unlockedHost = message.doNotBlockHost;
        if (unlockedHost === hostname) closeCurrentTab();
      }
    });
  }
}

export { TabBlocker };
