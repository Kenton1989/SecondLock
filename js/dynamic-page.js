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
   * @param {function(any): any} callback the initialization function
   */
  static dynamicInit(callback) {
    // execute the callback directly if the arguments is buffered.
    // otherwise, register for the buffering events.
    if (DynamicPage.#args != undefined) {
      callback(DynamicPage.#args);
    } else {
      document.addEventListener(
        DynamicPage.#ARGS_BUFFERED_EVENT_KEY,
        function (e) {
          callback(DynamicPage.#args);
        }
      );
    }
  }

  static setup() {
    // avoid multiple setup
    if (DynamicPage.#setup) return;
    DynamicPage.#setup = true;

    // Request arguments
    chrome.runtime.sendMessage(
      { dynamic_page_init_request: true },
      {},
      function (response) {
        if (DynamicPage.#args != undefined) {
          throw new Error("Multiple set of arguments are passed in.");
        }
        // Buffering the argument
        DynamicPage.#args = response.dynamic_page_init_args;
        // Trigger the argument reception event
        let args_arrive_event = new Event(DynamicPage.#ARGS_BUFFERED_EVENT_KEY);
        document.dispatchEvent(args_arrive_event);
      }
    );
  }
}

DynamicPage.setup();

export { DynamicPage };
