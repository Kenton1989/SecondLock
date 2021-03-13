import { api } from "./api.js";

class DynamicPage {
  // Buffered arguments
  static _args = undefined;
  // Setup flag
  static _setup = false;
  // event key
  static _ARGS_BUFFERED_EVENT_KEY = "dynamic-page-arguments-buffered";

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
    if (DynamicPage._args != undefined) {
      console.debug("using buffered arg.");
      callback(DynamicPage._args);
    } else {
      document.addEventListener(
        DynamicPage._ARGS_BUFFERED_EVENT_KEY,
        function (e) {
          console.debug("arg received.");
          callback(DynamicPage._args);
        }
      );
    }
  }

  static setup() {
    // avoid multiple setup
    if (DynamicPage._setup) return;
    DynamicPage._setup = true;

    api.tabs.getCurrent().then(function (tab) {
      if (!tab) return;
      console.debug("current tab id: ", tab.id);
    });

    // Passive receive argument
    api.runtime.onMessage.addListener(function (message) {
      if (message.dynamicPageInitArgs) {
        console.debug("arg received (passive): ", message.dynamicPageInitArgs);
        DynamicPage._setArgs(message.dynamicPageInitArgs);
      }
    });

    // Active Request arguments
    api.runtime
      .sendMessage({ dynamicPageInitRequest: true })
      .then(function (response) {
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
        DynamicPage._setArgs(response.dynamicPageInitArgs);
      });
  }

  static _setArgs(args) {
    // Already buffered
    if (DynamicPage._args != undefined) {
      return;
    }
    // Buffering the argument
    DynamicPage._args = args;
    // Trigger the argument reception event
    let argsArriveEvent = new Event(DynamicPage._ARGS_BUFFERED_EVENT_KEY);
    document.dispatchEvent(argsArriveEvent);
  }
}

DynamicPage.setup();

export { DynamicPage };
