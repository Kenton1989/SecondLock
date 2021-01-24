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
const kHostnamePattern = /^([a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?\.)*[a-z]{2,}$/i;
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
const k0To255 = "((25[0-5])|(2[0-4][0-9])|([01][0-9]{0,2}))";
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

// Patterns used to match a IPv6 address.
const k0ToFFFF = "([0-9A-F]{1,4})";
const kIPv6HostNoCompress = new RegExp(
  `^\\[(${k0ToFFFF}:){7}${k0ToFFFF}\\]$`,
  "i"
);
const kIPv6Parts = `((${k0ToFFFF}(:${k0ToFFFF}){0,6})?)`;
const kIPv6HostCompressedWeak = new RegExp(
  `^\\[${kIPv6Parts}::${kIPv6Parts}\\]$`,
  "i"
);
const kHas2To7Colons = /^([^:]*:){2,7}[^:]*$/;
/**
 * Check if the given string is a valid IPv6 format hostname.
 *
 * That is, check if a string is a IPv6 address wrapped with square brackets.
 *
 * No extra whitespace characters are allowed.
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
    (kIPv6HostCompressedWeak.test(str) && kHas2To7Colons.test(str))
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

export {
  getUrlOfTab,
  validHostname,
  validIPv4Address,
  validIPv6Hostname,
  setTextForClass,
  closeCurrentTab,
};
