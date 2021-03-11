class DynamicPage {
  // Buffered arguments
  static #args = undefined;
  // Setup flag
  static #setup = false;
  // event key
  static #ARGS_BUFFERED_EVENT_KEY = "dynamic-page-arguments-buffered";

  /**
   * Initialize the current page with the given callback function.
   *
   * The arguments will be provided by the dynamic page backend.
   *
   * @param {function(any)} callback the initialization function
   */
  static dynamicInit(callback) {
    // execute the callback directly if the arguments is buffered.
    // otherwise, register for the buffering events.
    if (DynamicPage.#args != undefined) {
      console.debug("using buffered arg.");
      callback(DynamicPage.#args);
    } else {
      document.addEventListener(
        DynamicPage.#ARGS_BUFFERED_EVENT_KEY,
        function (e) {
          console.debug("arg received.");
          callback(DynamicPage.#args);
        }
      );
    }
  }

  static setup() {
    // avoid multiple setup
    if (DynamicPage.#setup) return;
    DynamicPage.#setup = true;

    chrome.tabs.getCurrent(function (tab) {
      if (!tab) return;
      console.debug("current tab id: ", tab.id);
    });

    // Passive receive argument
    chrome.runtime.onMessage.addListener(function (message) {
      if (message.dynamicPageInitArgs) {
        console.debug("arg received (passive): ", message.dynamicPageInitArgs);
        DynamicPage.#setArgs(message.dynamicPageInitArgs);
      }
    });

    // Active Request arguments
    chrome.runtime.sendMessage(
      { dynamicPageInitRequest: true },
      function (response) {
        // No argument received
        if (!response) {
          throw new Error("Failed to get page arguments.");
        }

        // Argument haven't been stored in the backend
        if (!response.dynamicPageInitArgs) {
          console.debug("The request is sent too soon.");
          return;
        }

        console.debug("arg received (active): ", response.dynamicPageInitArgs);
        DynamicPage.#setArgs(response.dynamicPageInitArgs);
      }
    );
  }

  static #setArgs(args) {
    // Already buffered
    if (DynamicPage.#args != undefined) {
      return;
    }
    // Buffering the argument
    DynamicPage.#args = args;
    // Trigger the argument reception event
    let argsArriveEvent = new Event(DynamicPage.#ARGS_BUFFERED_EVENT_KEY);
    document.dispatchEvent(argsArriveEvent);
  }
}

DynamicPage.setup();

export { DynamicPage };