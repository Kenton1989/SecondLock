import { DynamicPageBackend } from "./dynamic-page-backend.js";
import {
  closeCurrentTab,
  queryTabsUnder,
  validHostname,
  closeTabs,
} from "./utility.js";

const selectTimeURL = chrome.runtime.getURL("select-time.html");
const timesUpPageURL = chrome.runtime.getURL("times-up.html");

/**
 * Block a tab and open the time selection page.
 *
 * @param {chrome.tabs.Tab} tab the tab on which the host is accessed.
 * @param {String} hostname the hostname to be blocked.
 */
function blockPageToSelectTime(tab, hostname) {
  DynamicPageBackend.openOnNewTab(
    selectTimeURL,
    { blockedHost: hostname },
    { windowId: tab.windowId }
  );
}

const c = chrome.runtime.getURL("times-up.html");
/**
 * Block the content of a tab completely with given page and parameters.
 * @param {chrome.tabs.Tab} tab the tab on which the host is accessed.
 * @param {String} hostname the hostname to be blocked.
 * @param {String} newPageUrl the url of page used to override existing page.
 *  Assuming the page is dynamic page.
 * @param {*} param the param passed to dynamic page
 */
function blockPageCompletely(tab, hostname, newPageUrl, param = {}) {
  param.blockedHost = hostname;
  DynamicPageBackend.openOnExistingTab(newPageUrl, param, tab.id);
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
  queryTabsUnder(
    hostname,
    function (tabs) {
      for (const tab of tabs) {
        blockPageCompletely(tab, hostname, timesUpPageURL);
      }
    },
    { active: true }
  );

  // close all inactive page

  queryTabsUnder(hostname, closeTabs, { active: false });
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
