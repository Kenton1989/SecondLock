import {
  validHostname,
  validIPv4Address,
  validIPv6Hostname,
  reformatHostname,
} from "./utility.js";

// Different hostname type
const HOST_TYPE = Object.freeze({
  UNKNOWN: 0,
  NORMAL: 1,
  IPV4: 4,
  IPV6: 6,
});

/**
 * A class of set of hostname.
 *
 * When a normal hostname is added (e.g. google.com),
 * all its subdomain will be considered as added (e.g. drive.google.com).
 *
 * When a IPv4/IPv6 hostname is added, the hostname will be automatically reformated,
 * after reformation, exact matching will be performed.
 */
class HostnameSet {
  /**
   * Create a host name set with the given list of host.
   *
   * @param {Iterable<string>} hosts list of host to be added.
   *  If it is not given, an empty set will be created.
   */
  constructor(hosts = []) {
    this._hostMap = new Map();
    this._matchingRegex = /$^/;
    this.addList(hosts);
  }

  /**
   * The size of hostname set
   */
  get size() {
    return this._hostMap.size;
  }

  /**
   * Check if a hostname is in the set.
   * @param {String} hostname the hostname to be checked.
   * @returns {*} the actual monitored host suffix if the hostname is monitored.
   *    If the hostname is not monitored, return undefined
   */
  findSuffix(hostname) {
    hostname = reformatHostname(hostname);
    if (!hostname) return undefined;

    let result = this._matchingRegex.exec(hostname);
    if (!result) return undefined;

    let actualHost = result[0];
    if (actualHost[0] === ".") {
      actualHost = actualHost.slice(1);
    }

    return actualHost;
  }

  /**
   *
   * @param {string} hostname the host name to be check
   * @return {boolean} true if the hostname is in the set
   */
  has(hostname) {
    hostname = reformatHostname(hostname);
    if (!hostname) return false;

    let result = this._matchingRegex.exec(hostname);

    return Boolean(result);
  }

  /**
   * Add a hostname into the set.
   * @param {String} hostname the hostname to be added
   * @returns {boolean} true if successfully added. If the hostname is invalid or
   *          the hostname is already existed, return false.
   */
  add(hostname) {
    if (!this._addToMap(hostname)) return false;

    this._updateRegex();
    return true;
  }

  /**
   * add a list of hostname into the set
   * @param {Iterable<string>} hostnameList the list of hostname to be added
   */
  addList(hostnameList) {
    hostnameList = [...hostnameList, ...this];

    this.reset(hostnameList);
  }

  /**
   * Remove a hostname from the set.
   * Exact match will be perform. (removing google.com will not affect www.google.com)
   * @param {String} hostname the hostname to be removed.
   * @return {boolean} true if the hostname exist in the list and being removed.
   */
  remove(hostname) {
    if (!this._removeFromMap(hostname)) return false;
    this._updateRegex();
    return true;
  }

  /**
   * Remove a list of hostname from the set
   * @param {Iterable<string>} hostnameList the list of hostname to be removed
   */
  removeList(hostnameList) {
    let dirty = false;
    for (const val of hostnameList) {
      dirty = this._removeFromMap(val) || dirty;
    }
    if (!dirty) return;

    this._updateRegex();
  }

  /**
   * Clear the hostname set.
   */
  clear() {
    this._hostMap.clear();
    this._matchingRegex = /$^/;
  }

  /**
   * Reset the new hostname set as the given list
   * @param {Iterable<string>} newHostList new hostname list
   */
  reset(newHostList = []) {
    this.clear();

    // Sort according to length in increasing order
    // This guarantee that subdomain is processed after its parent domain
    newHostList.sort((a, b) => a.length - b.length);
    for (const val of newHostList) {
      this._addToMap(val);
      this._updateRegex();
    }
  }

  /**
   * Make hostname set iterable.
   */
  [Symbol.iterator]() {
    return this._hostMap.keys();
  }

  /**
   * add a hostname into map, without updating regex matcher.
   * @param {String} hostname a hostname
   * @returns {boolean} true if a hostname is successfully added.
   */
  _addToMap(hostname) {
    let formattedHost = reformatHostname(hostname);
    if (!formattedHost) {
      console.warn(`Invalid hostname: ${hostname}`);
      return false;
    }
    if (this.has(formattedHost)) return false;

    if (validIPv4Address(formattedHost)) {
      this._hostMap.set(formattedHost, HOST_TYPE.IPV4);
    } else if (validIPv6Hostname(formattedHost)) {
      this._hostMap.set(formattedHost, HOST_TYPE.IPV6);
    } else {
      this._hostMap.set(formattedHost, HOST_TYPE.NORMAL);
    }

    return true;
  }

  /**
   * remove a hostname from map, without updating matcher.
   * @param {String} hostname a hostname
   * @returns {boolean} true if a hostname is removed from the map
   */
  _removeFromMap(hostname) {
    let formattedHost = reformatHostname(hostname);
    if (!formattedHost) {
      console.warn(`Invalid hostname: ${hostname}`);
      return false;
    }
    return this._hostMap.delete(hostname);
  }

  /**
   * Update the regex matcher for hostname.
   */
  _updateRegex() {
    // initialized with an impossible pattern.
    let pattern = "($^)";

    for (const pair of this._hostMap) {
      if (pair[1] === HOST_TYPE.NORMAL) {
        // Match suffix
        pattern += `|((^|\\.)(${pair[0]})$)`;
      } else {
        // Exact match
        pattern += `|(^${pair[0]}$)`;
      }
    }

    this._matchingRegex = new RegExp(pattern, "i");
  }
}

export default HostnameSet;
