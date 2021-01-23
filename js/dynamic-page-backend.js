class DynamicPageBackend {
  static #tabArgs = {};
  static #setup = false;

  static setup() {
    // avoid multiple setup
    if (DynamicPageBackend.#setup) return;
    DynamicPageBackend.#setup = true;

    // send arguments back on request.
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      if (message.dynamic_page_init_request) {
        let tabId = sender.tab.id;
        let args = DynamicPageBackend.#tabArgs[tabId];
        sendResponse({dynamic_page_init_args: args});
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
  static openOnExistingTab(url, pageArgs, tabId, callback = function(tab){}) {
    DynamicPageBackend.#tabArgs[tabId] = pageArgs;
    chrome.tabs.update(tabId, { url: url }, callback);
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
  static openOnNewTab(url, pageArgs, tabProperties = {}, callback = function(tab){}) {
    tabProperties.url = url;
    chrome.tabs.create(tabProperties, function(tab) {
      DynamicPageBackend.#tabArgs[tab.id] = pageArgs;
      callback(tab);
    });
  }
}

DynamicPageBackend.setup();

export { DynamicPageBackend };
