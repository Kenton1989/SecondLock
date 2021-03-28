import { api } from "../common/api";

// Short name for selectors
function $(selector, element = document) {
  return element.querySelector(selector);
}

function $$(selector, element = document) {
  return element.querySelectorAll(selector);
}

function $id(id, element = document) {
  return element.getElementById(id);
}

function $cls(cls, element = document) {
  return element.getElementsByClassName(cls);
}

function $tag(tag, element = document) {
  return element.getElementsByTagName(tag);
}

// Translate
function $t(msgKey, ...param) {
  return api.i18n.getMessage(msgKey, ...param);
}

/**
 * Get the URL object of the url of the given tab.
 *
 * If neither tab.url nor the tab.pendingUrl is set, the function return undefined.
 *
 * @param {*} tab chrome tab object
 * @returns {URL} the URL object of the url of the given tab.
 */
function getUrlOfTab(tab) {
  var urlStr = tab.url;
  if (!urlStr) urlStr = tab.pendingUrl;
  if (!urlStr) return undefined;
  return new URL(urlStr);
}

// Pattern used to match a hostname.
const kHostnamePattern = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
/**
 * Check if the given string is a valid hostname
 *
 * @param {String} str the string to be checked
 * @returns {boolean} true if it is a valid hostname.
 */
function validHostname(str) {
  return kHostnamePattern.test(str);
}

// Patterns used to match a IPv4 address.
const k0To255 = "((25[0-5])|(2[0-4][0-9])|([01]?[0-9]?[0-9]))";
const kIPv4Pattern = new RegExp(`^(${k0To255}\\.){3}${k0To255}$`);
/**
 * Check if the given string is a valid IPv4 address.
 *
 * No extra whitespace characters are allowed.
 *
 * @param {String} str the string to be checked
 * @returns {boolean} true if it is a  IPv4 address.
 */
function validIPv4Address(str) {
  return kIPv4Pattern.test(str);
}

// Patterns used to match a IPv6 Address.
const k0ToFFFF = "([\\dA-F]{1,4})";
const kIPv6NoCompress = `(${k0ToFFFF}:){7}${k0ToFFFF}`;
const kIPv6Parts = `((${k0ToFFFF}(:${k0ToFFFF}){0,6})?)`;
const kIPv6Compressed = `${kIPv6Parts}::${kIPv6Parts}`;
const kHas2To7Colons = /^([^:]*:){2,7}[^:]*$/;

const kIPv6AddrNoCompress = new RegExp(`^${kIPv6NoCompress}$`, "i");
const kIPv6AddrCompressed = new RegExp(`^${kIPv6Compressed}$`, "i");
/**
 * Check if the given string is a valid IPv6 format address.
 * @param {String} str the string to be checked
 * @returns {boolean} true if it is a valid IPv6 format address.
 */
function validIPv6Address(str) {
  return (
    kIPv6AddrNoCompress.test(str) ||
    (kIPv6AddrCompressed.test(str) && kHas2To7Colons.test(str))
  );
}

// Patterns used to match a IPv6 Hostname.
const kIPv6HostNoCompress = new RegExp(`^\\[${kIPv6NoCompress}\\]$`, "i");
const kIPv6HostCompressed = new RegExp(`^\\[${kIPv6Compressed}\\]$`, "i");
/**
 * Check if the given string is a valid IPv6 format hostname.
 *
 * That is, check if a string is a IPv6 address wrapped with square brackets.
 *
 * No extra whitespace characters are allowed in the string.
 *
 * e.g.
 * - "[::]", "[a::90:1]", "[af12:3:14::]" are valid strings
 * - "::", "[192.168.1.1]", " [::] ", "[1:2:3:4:5:6:7::]" are not
 *
 * @param {String} str the string to be checked
 * @returns {boolean} true if it is a valid IPv6 format hostname.
 */
function validIPv6Hostname(str) {
  return (
    kIPv6HostNoCompress.test(str) ||
    (kIPv6HostCompressed.test(str) && kHas2To7Colons.test(str))
  );
}

/**
 * Set the innerText property for all elements in the document
 * with given className to the given text.
 * @param {String} className class name of elements.
 * @param {String} text text to be set as innerText property of elements.
 */
function setTextForClass(className, text) {
  let elements = $cls(className);
  for (const element of elements) {
    element.innerText = text;
  }
}

/**
 * Close current tab.
 */
function closeCurrentTab() {
  api.tabs.getCurrent().then(function (tab) {
    if (!tab) return;
    api.tabs.remove(tab.id);
  });
}

const HOSTNAME_CHARS = /^[a-z0-9:\-.[\]]*$/i;
/**
 * Reformat a hostname into what chrome would like to display.
 * - lowercase hostname
 * - for ip hostname, omit redundancy
 *
 * For strict format checking, no character will be ignore or added
 * during format checking.
 *
 * For loose (non-strict) format checking:
 * - heading and tailing space will be ignore
 * - IPv6 address will be wrap with bracket automatically
 *
 * @param {string} hostname a hostname
 * @param {boolean} strict if the format checking is strict
 * @returns {(string|undefined)} the formatted hostname, or
 *  undefined if the input host name is invalid
 */
function reformatHostname(hostname, strict = true) {
  if (!strict) {
    hostname = hostname.trim();
    if (validIPv6Address(hostname)) hostname = `[${hostname}]`;
  }

  if (!HOSTNAME_CHARS.test(hostname)) return undefined;
  let url = undefined;
  try {
    url = new URL(`http://${hostname}`);
  } catch (e) {
    console.warn(e);
    return undefined;
  }

  if (
    !validHostname(url.hostname) &&
    !validIPv4Address(url.hostname) &&
    !validIPv6Hostname(url.hostname)
  ) {
    return undefined;
  }

  return url.hostname;
}

let blinkTimeoutMap = new Map();
/**
 * Make a element blinking for finite times by setting its opacity.
 * @param {Element} element the doc element to blink
 * @param {number} times blink for how many times
 * @param {number} period the period of blinking in milliseconds
 * @param {string} display whether the element is shown after blinking
 */
function blinkElement(element, times = 3, period = 200, display = true) {
  if (times <= 0) {
    element.style.opacity = display ? 1 : 0;
    return;
  } else {
    element.style.opacity = 1;
  }

  // Clear existing timeout managing blinking of this element
  let existing = blinkTimeoutMap.get(element);
  if (existing !== undefined) window.clearTimeout(existing);

  let timeoutId = window.setTimeout(function () {
    element.style.opacity = 0;
    let timeoutId = window.setTimeout(function () {
      blinkElement(element, times - 1, period, display);
    }, period / 2);
    blinkTimeoutMap.set(element, timeoutId);
  }, period / 2);
  blinkTimeoutMap.set(element, timeoutId);
}

/**
 * Display text in the given element
 *
 * @param {Element} element the element used to show text
 * @param {string} text the text to be shown
 * @param {boolean} blink whether the element is blink after setting the text
 * @param  {...any} blinkArgs other parameters passed to blinkElement
 */
function showTxt(element, text, blink = true, ...blinkArgs) {
  element.innerText = text;
  if (blink) blinkElement(element, ...blinkArgs);
}

/**
 * Format bytes size into human readable form.
 * @param {number} bytes bytes to be formatted
 * @returns {string} the formatted string
 */
const BYTE_UNIT = ["B", "KB", "MB", "GB", "TB"];
const STEP = 1024.0;
function formatBytes(bytes) {
  let unit = 0;
  while (bytes > STEP) {
    bytes /= STEP;
    ++unit;
  }
  return `${bytes.toFixed(1)}${BYTE_UNIT[unit]}`;
}

// Aux function of function closeTabs(toClose, leaveOneTab)
async function closeTabIds(toClose, leaveOneTab = false) {
  if (leaveOneTab) {
    let toCloseSet = new Set(toClose);
    let topWindow = await api.windows.getLastFocused({ populate: true });

    for (const tab of topWindow.tabs) {
      // if some tabs in the top window won't be closed
      if (!toCloseSet.has(tab.id)) {
        return;
      }
    }

    // all tabs in the top window are to be closed
    await api.tabs.create({ windowId: topWindow.id });
  }
  api.tabs.remove(toClose);
}

/**
 * close a list of tabs
 * @param {(api.tabs.Tab[]|number[])} toClose the tab objects, or the id of tabs to be closed.
 *    Mixture of tab objects and tab id is not allowed.
 * @param {boolean} leaveOneTab whether a new tab will be created on the top window
 *    if all tabs in the top window are closed
 * @returns {Promise<undefined>} promise after all tabs are closed
 */
async function closeTabs(toClose, leaveOneTab = false) {
  if (toClose.length <= 0) return;

  if (typeof toClose[0] === "number") {
    return closeTabIds(toClose, leaveOneTab);
  }

  let tabIds = toClose.map((tab) => tab.id);

  if (leaveOneTab) {
    let topWindow = await api.windows.getLastFocused({ populate: true });

    let closedOnTop = 0;
    for (const tab of toClose) {
      closedOnTop += tab.windowId === topWindow.id;
    }

    // create a new tab if all tabs on the top window will be closed.
    if (closedOnTop === topWindow.tabs.length) {
      await api.tabs.create({ windowId: topWindow.id });
    }
  }

  return api.tabs.remove(tabIds);
}

/**
 * query tabs under the given hostname.
 *
 * @param {string} hostname the hostname to be query
 * @param {*} args other arguments to be passed to api.tabs.query
 * @returns {Promise<api.tabs.Tab[]>} the promise resolved with query result
 */
function queryTabsUnder(hostname, args = {}) {
  let pattern = hostname;

  if (validHostname(hostname)) {
    pattern = `*.${hostname}`;
  }

  args.url = `*://${pattern}/*`;

  return api.tabs.query(args);
}

/**
 * Create a promise that will be resolved after a given time length
 * @param {number} ms the milliseconds to wait
 * @returns {Promise<undefined>} a promise resolve after a given time length
 */
function wait(ms) {
  let prom = new Promise((resolve) => {
    prom._timeoutHandle = setTimeout(() => {
      delete prom._timeoutHandle;
      resolve();
    }, ms);
  });
  return prom;
}

/**
 * Cancel a waiting promise created through function wait(ms)
 * @param {Promise} prom promise created by wait()
 */
function unWait(prom) {
  if (prom._timeoutHandle === undefined) return;
  clearTimeout(prom._timeoutHandle);
  delete prom._timeoutHandle;
}

/**
 * async version of window.alert
 *
 * @param  {...any} msgs the message to display
 * @returns {Promise<undefined>} promise resolved after alert is close
 */
function asyncAlert(...msgs) {
  // not using Promise constructor to avoid unexpected blocking
  return Promise.resolve().then(() => {
    window.alert(...msgs);
  });
}

export {
  getUrlOfTab,
  validHostname,
  validIPv4Address,
  validIPv6Address,
  validIPv6Hostname,
  setTextForClass,
  closeCurrentTab,
  reformatHostname,
  blinkElement,
  showTxt,
  formatBytes,
  queryTabsUnder,
  closeTabs,
  wait,
  unWait,
  $,
  $$,
  $id,
  $cls,
  $tag,
  $t,
  asyncAlert,
};
