class DynamicPageBackend {
  /**
   * Open the given dynamic page with the given arguments on the given tab.
   *
   * @param {String} url the url to the dynamic page be opened
   * @param {any} pageArgs the arguments passed to the dynamic page
   * @param {Number} tabId tab id of the page on which the page is opened.
   */
  static openOnExistingTab(url, pageArgs, tabId) {
    chrome.tabs.update(tabId, { url: url }, function (tab) {
      DynamicPageBackend.#sendArgs(tab.id, pageArgs);
    });
  }

  /**
   * Open the given dynamic page with the given arguments on a new tab.
   * 
   * @param {String} url the url to the dynamic page to be opened
   * @param {any} pageArgs the arguments passed to the dynamic page
   * @param {*} tabProperties the properties of the new tab passed to the method 
   * chrome.tabs.create(). The tabProperties.url will be ignored if it is defined.
   */
  static openOnNewTab(url, pageArgs, tabProperties = {}) {
    tabProperties.url = url;
    chrome.tabs.create(tabProperties, function (tab) {
      DynamicPageBackend.#sendArgs(tab.id, pageArgs);
    });
  }

  static #sendArgs(tabId, args) {
    // Wait for page loading for a while,
    // and then send the arguments to the dynamic page.
    window.setTimeout(function () {
      chrome.tabs.sendMessage(tabId, { dynamic_page_init_args: args });
    }, 100);
  }
}

export { DynamicPageBackend };
