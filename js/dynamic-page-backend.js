class DynamicPageBackend {
  static #tabArgs = new Map();
  static #setup = false;

  static setup() {
    // avoid multiple setup
    if (DynamicPageBackend.#setup) return;
    DynamicPageBackend.#setup = true;

    // send arguments back on request.
    chrome.runtime.onMessage.addListener(function (
      message,
      sender,
      sendResponse
    ) {
      if (message.dynamic_page_init_request) {
        let tabId = sender.tab.id;
        let args = DynamicPageBackend.#tabArgs.get(tabId);
        sendResponse({ dynamic_page_init_args: args });
      }
    });

    // remove args of tab on close
    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
      console.log(`Tab #${tabId} closed.`);
      if (DynamicPageBackend.#tabArgs.delete(tabId)) {
        console.log(`Argument for tab #${tabId} deleted.`);
      }
    });
  }

  /**
   * Open the given dynamic page with the given arguments on the given tab.
   *
   * @param {String} url the url to the dynamic page be opened
   * @param {any} pageArgs the arguments passed to the dynamic page
   * @param {Number} tabId tab id of the page on which the page is opened.
   * @param {function(any)} callback the callback after the tab is created. 1st parameter is updated tab object.
   */
  static openOnExistingTab(url, pageArgs, tabId, callback = function (tab) {}) {
    DynamicPageBackend.#tabArgs.set(tabId, pageArgs);
    chrome.tabs.update(tabId, { url: url }, callback);
    console.log(`Overwriting tab #${tabId} with URL:${url}.`);
  }

  /**
   * Open the given dynamic page with the given arguments on a new tab.
   *
   * @param {String} url the url to the dynamic page to be opened
   * @param {any} pageArgs the arguments passed to the dynamic page
   * @param {*} tabProperties the properties of the new tab passed to the method
   * chrome.tabs.create(). The tabProperties.url will be ignored if it is defined.
   * @param {function(any)} callback the callback after the tab is created. 1st parameter is newly created tab object.
   */
  static openOnNewTab(
    url,
    pageArgs,
    tabProperties = {},
    callback = function (tab) {}
  ) {
    tabProperties.url = url;
    chrome.tabs.create(tabProperties, function (tab) {
      DynamicPageBackend.#tabArgs.set(tab.id, pageArgs);
      console.log(`Created tab #${tab.id} opened with URL:${url}.`);
      callback(tab);
    });
  }
}

DynamicPageBackend.setup();

export { DynamicPageBackend };
