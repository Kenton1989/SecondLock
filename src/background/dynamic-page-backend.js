import { api } from "./api.js.js.js.js";
import { RemoteCallable } from "./remote-callable.js.js.js.js";

const RECEIVER_DOES_NOT_EXIST_MSG =
  "Could not establish connection. Receiving end does not exist.";

class DynamicPageBackend extends RemoteCallable {
  constructor(name) {
    super(name);

    this._tabArgs = new Map();

    // shorter name
    let tabArgs = this._tabArgs;

    // send arguments back on request.
    api.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (message.dynamicPageInitRequest) {
        let tabId = sender.tab.id;
        let args = tabArgs.get(tabId);
        sendResponse({ dynamicPageInitArgs: args });
      }
    });

    // remove args of tab on close
    api.tabs.onRemoved.addListener(function (tabId, removeInfo) {
      console.debug(`Tab #${tabId} closed.`);
      if (tabArgs.delete(tabId)) {
        console.debug(`Argument for tab #${tabId} deleted.`);
      }
    });
  }

  /**
   * Open the given dynamic page with the given arguments on the given tab.
   *
   * @param {String} url the url to the dynamic page be opened
   * @param {any} pageArgs the arguments passed to the dynamic page
   * @param {Number} tabId tab id of the page on which the page is opened.
   * @returns {Promise} promise resolved with updated api.tabs.Tab object after the url is opened
   */
  openOnExistingTab(url, pageArgs, tabId) {
    this._tabArgs.set(tabId, pageArgs);
    console.debug(`Overwriting tab #${tabId} wit URL:${url}.`);
    return api.tabs.update(tabId, { url: url });
  }

  /**
   * Open the given dynamic page with the given arguments on a new tab.
   *
   * @param {(String|undefined)} url the url to the dynamic page to be opened,
   *  if it is undefined, default new tab of chrome will be opened.
   * @param {any} pageArgs the arguments passed to the dynamic page
   * @param {*} tabProperties the properties of the new tab passed to the method
   * api.tabs.create(). The tabProperties.url will be ignored if it is defined.
   * @returns {Promise} The promise resolved with newly created tab after the tab is created
   */
  async openOnNewTab(url, pageArgs, tabProperties = {}) {
    if (url == undefined) delete tabProperties.url;
    else tabProperties.url = url;

    let tab = await api.tabs.create(tabProperties);
    this._tabArgs.set(tab.id, pageArgs);
    console.debug(`Created tab #${tab.id} opened with URL:${url}.`);
    
    // Actively send arguments
    api.tabs
      .sendMessage(tab.id, { dynamicPageInitArgs: pageArgs })
      .catch((reason) => {
        if (reason.message == RECEIVER_DOES_NOT_EXIST_MSG) {
          console.debug(
            `Argument sent too early. Tab #${tab.id} haven't setup.`
          );
        } else {
          throw reason;
        }
      });
    console.debug("Sent argument: ", pageArgs);
    return tab;
  }

  /**
   * Get the parameters bind to the given tab.
   *
   * @param {number} tabId the id of tab to get parameters
   * @return {*} the paramter bind to the tab
   */
  getParam(tabId) {
    return this._tabArgs.get(tabId);
  }

  /**
   * @returns {Iterable<[number, *]>} iterable containing all id of tabs and their parameters
   */
  idsAndParams() {
    return this._tabArgs.entries();
  }
}

export { DynamicPageBackend };
