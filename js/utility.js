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
const kHostnamePattern = /^([a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?\.)*[a-z][a-z0-9]{1,62}$/i;
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
const k0ToFFFF = "([dA-F]{1,4})";
const kIPv6NoCompress = `(${k0ToFFFF}:){7}${k0ToFFFF}`;
const kIPv6Parts = `((${k0ToFFFF}(:${k0ToFFFF}){0,6})?)`;
const kIPv6Compressed = `${kIPv6Parts}::${kIPv6Parts}`;
const kHas2To7Colons = /^([^:]*:){2,7}[^:]*$/;

const kIPv6AddrNoCompress = new RegExp(`^${kIPv6NoCompress}$`, "i");
const kIPv6AddrCompressed = new RegExp(`^${kIPv6Compressed}$`, "i");
/**
 * Check if the given string is a valid IPv6 format hostname.
 * @param {String} str the string to be checked
 * @returns {boolean} true if it is a valid IPv6 format hostname.
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
  let elements = document.getElementsByClassName(className);
  for (const element of elements) {
    element.innerText = text;
  }
}

/**
 * Close current tab.
 */
function closeCurrentTab() {
  chrome.tabs.getCurrent(function (tab) {
    if (!tab) return;
    chrome.tabs.remove(tab.id);
  });
}

const HOSTNAME_CHARS = /^[a-z0-9:\-\.\[\]]*$/i;
/**
 * Reformat a hostname into what chrome would like to display.
 * - lowercase hostname
 * - for ip hostname, omit redundancy
 *
 * @param {string} hostname a hostname
 * @returns {(string|undefined)} the formatted hostname, or
 *  undefined if the input host name is invalid
 */
function reformatHostname(hostname) {
  if (!HOSTNAME_CHARS.test(hostname)) return undefined;
  let url = undefined;
  try {
    url = new URL(`http://${hostname}`);
  } catch (e) {
    console.warn(e);
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
  if (existing != undefined) window.clearTimeout(existing);

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

/**
 * close a list of tabs
 * @param {chrome.tabs.Tab[]} tabs the tabs to be closed
 * @param {function()} callback the callback on tabs are closed.
 */
function closeTabs(tabs, callback = undefined) {
  let tabIds = tabs.map((tab) => tab.id);
  chrome.tabs.remove(tabIds, callback);
}

/**
 * query tabs under the given hostname.
 *
 * @param {string} hostname the hostname to be query
 * @param {function(chrome.tabs.Tab[])} callback the result
 * @param {*} args other arguments to be passed to chrome.tabs.query
 */
function queryTabsUnder(hostname, callback, args = {}) {
  let pattern = hostname;

  if (validHostname(hostname)) {
    pattern = `*.${hostname}`;
  }

  args.url = `*://${pattern}/*`;

  chrome.tabs.query(args, callback);
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
};
