import { DynamicPageBackend } from "./dynamic-page-backend.js";
import { closeCurrentTab, validHostname } from "./utility.js";

const kSelectTimeURL = chrome.runtime.getURL("select-time.html");
/**
 * Block a tab and open the time selection page.
 *
 * @param {chrome.tabs.Tab} tab the tab on which the host is accessed.
 * @param {String} hostname the hostname to be blocked.
 */
function blockPageToSelectTime(tab, hostname) {
  DynamicPageBackend.openOnNewTab(
    kSelectTimeURL,
    { blockedHost: hostname },
    { windowId: tab.windowId }
  );
}

const kBlockingPageURL = chrome.runtime.getURL("blocking.html");
/**
 * Block the content of a tab completely.
 * @param {chrome.tabs.Tab} tab the tab on which the host is accessed.
 * @param {String} hostname the hostname to be blocked.
 */
function blockPageCompletely(tab, hostname) {
  DynamicPageBackend.openOnExistingTab(
    kBlockingPageURL,
    { blockedHost: hostname },
    tab.id
  );
}

/**
 * Block all tabs with the given hostname.
 * @param {String } hostname the hostname to be blocked
 */
function blockAllTabsOf(hostname) {
  let pattern = hostname;

  if (validHostname(hostname)) {
    pattern = `*.${hostname}`;
  }

  // block active page
  chrome.tabs.query(
    {
      url: `*://${pattern}/*`,
      active: true,
    },
    function (tabs) {
      for (const tab of tabs) {
        blockPageCompletely(tab, hostname);
      }
    }
  );

  // close all inactive page
  chrome.tabs.query(
    {
      url: `*://${pattern}/*`,
      active: false,
    },
    function (tabs) {
      for (const tab of tabs) {
        chrome.tabs.remove(tab.id);
      }
    }
  );
}

/**
 * Notify all tabs that are blocking the given hostname to unblock.
 *
 * @param {String} hostname the hostname to be unblocked.
 */
function notifyUnblock(hostname) {
  chrome.runtime.sendMessage({
    doNotBlockHost: hostname,
  });
}

/**
 * [For content script only] Auto unblock the given page
 * when the given tab should be unblocked.
 *
 * @param {String} hostname the hostname to be unblocked.
 */
function autoUnblock(hostname) {
  if (!hostname) return;
  chrome.runtime.onMessage.addListener(function (message) {
    if (message.doNotBlockHost) {
      let unlockedHost = message.doNotBlockHost;
      if (unlockedHost == hostname) closeCurrentTab();
    }
  });
}

export {
  notifyUnblock,
  autoUnblock,
  blockPageToSelectTime,
  blockPageCompletely,
  blockAllTabsOf,
};
