import { api } from "../../common/api";

// Buffered arguments
let _args = undefined;
// Setup flag
let _setup = false;
// event key
const ARGS_BUFFERED_EVENT_KEY = "dynamic-page-arguments-buffered";

function setup() {
  // avoid multiple setup
  if (_setup) return;
  _setup = true;

  api.tabs.getCurrent().then((tab) => {
    if (!tab) return;
    console.debug("current tab id: ", tab.id);
  });

  // Passive receive argument
  api.runtime.onMessage.addListener((message) => {
    if (message.dynamicPageInitArgs) {
      console.debug("arg received (passive): ", message.dynamicPageInitArgs);
      setArgs(message.dynamicPageInitArgs);
    }
  });

  // Active Request arguments
  api.runtime.sendMessage({ dynamicPageInitRequest: true }).then((response) => {
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
    setArgs(response.dynamicPageInitArgs);
  });
}

function setArgs(args) {
  // Already buffered
  if (_args !== undefined) {
    return;
  }
  // Buffering the argument
  _args = args;
  // Trigger the argument reception event
  let argsArriveEvent = new Event(ARGS_BUFFERED_EVENT_KEY);
  document.dispatchEvent(argsArriveEvent);
}

/**
 * Initialize the current page with the given callback function.
 *
 * The arguments will be provided by the dynamic page backend.
 *
 * @param {function(any)} callback the initialization function
 */
function dynamicInit(callback) {
  setup();
  // execute the callback directly if the arguments is buffered.
  // otherwise, register for the buffering events.
  if (_args !== undefined) {
    console.debug("using buffered arg.");
    callback(_args);
  } else {
    document.addEventListener(ARGS_BUFFERED_EVENT_KEY, (e) => {
      console.debug("arg received.");
      callback(_args);
    });
  }
}

export { dynamicInit };
