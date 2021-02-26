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
  #hostMap = new Map();
  #matchingRegex = /$^/;

  /**
   * Create a host name set with the given list of host.
   *
   * @param {Iterable<string>} hosts list of host to be added.
   *  If it is not given, an empty set will be created.
   */
  constructor(hosts = []) {
    this.addList(hosts);
  }

  /**
   * The size of hostname set
   */
  get size() {
    return this.#hostMap.size;
  }

  /**
   * Check if a hostname is in the set.
   * @param {String} hostname the hostname to be checked.
   * @returns {*} the actual monitored host suffix if the hostname is monitored.
   *    If the hostname is not monitored, return undefined
   */
  has(hostname) {
    hostname = reformatHostname(hostname);
    if (!hostname) return undefined;

    let result = this.#matchingRegex.exec(hostname);
    if (!result) return undefined;

    let actualHost = result[0];
    if (actualHost[0] == ".") {
      actualHost = actualHost.slice(1);
    }

    return actualHost;
  }

  /**
   * Add a hostname into the set.
   * @param {String} hostname the hostname to be added
   * @returns {boolean} true if successfully added. If the hostname is invalid or
   *          the hostname is already existed, return false.
   */
  add(hostname) {
    if (!this.#addToMap(hostname)) return false;

    this.#updateRegex();
    return true;
  }

  /**
   * add a list of hostname into the set
   * @param {Iterable<string>} hostnameList the list of hostname to be added
   */
  addList(hostnameList) {
    // avoid affecting original iterable
    hostnameList = [...hostnameList];

    // Sort according to length in decreasing order
    // This guarantee that subdomain is processed after its parent domain
    hostnameList.sort((a, b) => a.length - b.length);
    for (const val of hostnameList) {
      this.#addToMap(val);
      this.#updateRegex();
    }

  }

  /**
   * Remove a hostname from the set.
   * @param {String} hostname the hostname to be removed.
   * @return {boolean} true if the hostname exist in the list and being removed.
   */
  remove(hostname) {
    if (!this.#removeFromMap(hostname)) return false;
    this.#updateRegex();
    return true;
  }

  /**
   * Remove a list of hostname from the set
   * @param {Iterable<string>} hostnameList the list of hostname to be removed
   */
  removeList(hostnameList) {
    let dirty = false;
    for (const val of hostnameList) {
      dirty = this.#removeFromMap(val) || dirty;
    }
    if (!dirty) return;

    this.#updateRegex();
  }

  /**
   * Clear the hostname set.
   */
  clear() {
    this.#hostMap.clear();
    this.#matchingRegex = /$^/;
  }

  /**
   * Reset the new hostname set as the given list
   * @param {Iterable<string>} newHostList new hostname list
   */
  reset(newHostList = []) {
    this.clear();
    this.addList(newHostList);
  }

  /**
   * Make hostname set iterable.
   */
  [Symbol.iterator]() {
    return this.#hostMap.keys();
  }

  /**
   * add a hostname into map, without updating matcher.
   * @param {String} hostname a hostname
   * @returns {boolean} true if a hostname is successfully added.
   */
  #addToMap(hostname) {
    let formattedHost = reformatHostname(hostname);
    if (!formattedHost) {
      console.warn(`Invalid hostname: ${hostname}`);
      return false;
    }
    if (this.has(formattedHost))
      return false;

    if (validHostname(formattedHost)) {
      this.#hostMap.set(formattedHost, HOST_TYPE.NORMAL);
    } else if (validIPv4Address(formattedHost)) {
      this.#hostMap.set(formattedHost, HOST_TYPE.IPV4);
    } else if (validIPv6Hostname(formattedHost)) {
      this.#hostMap.set(formattedHost, HOST_TYPE.IPV6);
    } else {
      console.warn(`Invalid hostname: ${hostname}`);
      return false;
    }

    return true;
  }

  /**
   * remove a hostname from map, without updating matcher.
   * @param {String} hostname a hostname
   * @returns {boolean} true if a hostname is removed from the map
   */
  #removeFromMap(hostname) {
    let formattedHost = reformatHostname(hostname);
    if (!formattedHost) {
      console.warn(`Invalid hostname: ${hostname}`);
      return false;
    }
    return this.#hostMap.delete(hostname);
  }

  /**
   * Update the regex matcher for hostname.
   */
  #updateRegex() {
    // initialized with an impossible pattern.
    let pattern = "($^)";

    for (const pair of this.#hostMap) {
      if (pair[1] == HOST_TYPE.NORMAL) {
        // Match suffix
        pattern += `|((^|\\.)(${pair[0]})$)`;
      } else {
        // Exact match
        pattern += `|(^${pair[0]}$)`;
      }
    }

    this.#matchingRegex = new RegExp(pattern, "i");
  }
}

export { HostnameSet };
