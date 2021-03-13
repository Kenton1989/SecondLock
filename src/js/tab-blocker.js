import { api } from "./api.js";
import { BrowsingPageMonitor } from "./browsing-page-monitor.js";
import { DynamicPageBackend } from "./dynamic-page-backend.js";
import { RemoteCallable } from "./remote-callable.js";
import {
  closeCurrentTab,
  queryTabsUnder,
  validHostname,
  closeTabs,
} from "./utility.js";

const kSelectTimeURL = api.runtime.getURL("select-time.html");
const kTimesUpPageURL = api.runtime.getURL("times-up.html");

class TabBlocker extends RemoteCallable {
  #monitor;
  #backend;
  /**
   * Create a tab blocker backing with the given dynamic page backend and monitor
   *
   * @param {string} name the name as an remote callable
   * @param {DynamicPageBackend} backend the dynamic page backend used to open blocking page
   * @param {BrowsingPageMonitor} monitor the monitor used to verify if the blocking is valid
   */
  constructor(name, backend, monitor) {
    super(name);
    this.#backend = backend;
    this.#monitor = monitor;
  }

  /**
   * Block a tab by opening a new tab in the same window.
   *
   * @param {api.tabs.Tab} tab the tab to be blocked.
   * @param {string} hostname the hostname to be blocked.
   * @param {string} blockingPageUrl the URL of the new page used for blocking
   * @returns {Promise}  The promise resolved with newly created tab
   *  after the given tab is blocked
   */
  blockPageWithNewTab(tab, hostname, blockingPageUrl) {
    return this.#backend.openOnNewTab(
      blockingPageUrl,
      { blockedHost: hostname },
      { windowId: tab.windowId }
    );
  }

  /**
   * Block the content of a tab completely with given page and parameters.
   *
   * @param {api.tabs.Tab} tab the tab on which the host is accessed.
   * @param {String} hostname the hostname to be blocked.
   * @param {String} newPageUrl the url of page used to override existing page.
   *  Assuming the page is dynamic page.
   * @param {*} param the param passed to dynamic page
   * @returns {Promise} promise resolved with updated api.tabs.Tab object
   * after the tab is blocked
   */
  blockPageByOverwriting(tab, hostname, newPageUrl, param = {}) {
    param.blockedHost = hostname;
    return this.#backend.openOnExistingTab(newPageUrl, param, tab.id);
  }

  /**
   * Block all tabs under the given hostname, unless the hostname is in the whitelist of monitor
   *
   * @param {string} hostname the hostname to be blocked
   * @param {string} blockingPageUrl the URL of new page used to block the tab. All active
   *  tabs will be overwrite with blockingPageUrl through method this.blockPageByOverwriting
   */
  blockAllTabsUnder(hostname, blockingPageUrl) {
    let pattern = hostname;

    if (validHostname(hostname)) {
      pattern = `*.${hostname}`;
    }

    // make private member visible
    let monitor = this.#monitor;
    let blocker = this;

    queryTabsUnder(hostname, { active: true }).then(function (tabs) {
      for (const tab of tabs) {
        if (monitor.isMonitoring(tab.url))
          blocker.blockPageByOverwriting(tab, hostname, blockingPageUrl);
      }
    });

    queryTabsUnder(hostname, { active: false }).then(function (tabs) {
      let toClose = tabs.filter((tab) => monitor.isMonitoring(tab.url));
      closeTabs(toClose);
    });
  }

  /**
   * Block all the page opening the given hostname by closing all page.
   * Whitelist of monitor will be checked before closing
   * @param {string} hostname the hostname to be blocked
   * @returns {Promise} the promise resolved with undefined after all tabs are closed
   */
  blockAllByClosing(hostname) {
    let monitor = this.#monitor;
    queryTabsUnder(hostname).then(function (tabs) {
      let toClose = tabs.filter((tab) => monitor.isMonitoring(tab.url));
      // temporary disable the monitor
      // since frequent tabs switching may happen when multiple tabs are close
      // which is likely to the trigger monitor unexpectedly
      let oldActive = monitor.active;
      monitor.active = false;

      return closeTabs(toClose).then(function () {
        monitor.active = oldActive;
      });
    });
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
    api.runtime.sendMessage({
      doNotBlockHost: hostname,
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
        if (unlockedHost == hostname) closeCurrentTab();
      }
    });
  }
}

export { TabBlocker };
