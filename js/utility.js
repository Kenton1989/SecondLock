/**
 * Get the URL object of the url of the given tab.
 * 
 * If neither tab.url nor the tab.pendingUrl is set, the function return undefined.
 * 
 * @param {chrome.tabs.Tab} tab
 * @returns {URL} the URL object of the url of the given tab.
 */
export function getUrlOfTab(tab) {
  var urlStr = tab.url;
  if (!urlStr) urlStr = tab.pendingUrl;
  if (!urlStr) return undefined;
  return new URL(urlStr);
}
