import { CustomEventWrapper } from "./custom-event-wrapper.js";

/**
 * All valid options
 */
const ALL_OPTION_NAME = [
  "monitoredList",
  "activated",
  "notificationOn",
  "notificationTimes",
  "activeDays",
  "pendingActiveDays",
  "syncOn",
  "defDurations",
  "motto",
];
const ALL_OPTION_NAME_SET = new Set(ALL_OPTION_NAME);
const SYNC_OPTION_NAME = ALL_OPTION_NAME;
const DEFAULT_OPTIONS = {
  monitoredList: [
    "youtube.com",
    "twitter.com",
    "facebook.com",
    "netflix.com",
    "reddit.com",
    "zhihu.com",
    "tieba.baidu.com",
    "tiktok.com",
    "bilibili.com",
  ],
  activated: true,
  notificationOn: false,
  notificationTimes: [10, 60, 5 * 60],
  activeDays: [0, 1, 2, 3, 4, 5, 6],
  pendingActiveDays: undefined,
  activeDayApplyTime: 0,
  syncOn: false,
  defDurations: [1, 5, 15, 30, 60, 120],
  mottos: ["Time waits for no one. – Folklore"],
};

/**
 * short name for storage lib
 */
const localStorage = chrome.storage.local;
// const syncStorage = chrome.storage.sync;

/**
 * Cache the value of the given option from the storage.
 * Notify all listener when the value of option updated.
 */
class OneOption {
  #eventTarget;
  #onUpdatedEvent;
  #storageKey;
  #value = undefined;

  /**
   * construct a option with the given EventTarget object to
   * manage the option updating event
   * @param {String} name name of the option
   * @param {EventTarget} eventTarget the given event target
   */
  constructor(name, eventTarget = document) {
    if (!ALL_OPTION_NAME_SET.has(name)) {
      throw new ReferenceError(`Create invalid option: ${thisOption}.`);
    }

    this.#eventTarget = eventTarget;

    this.#onUpdatedEvent = new CustomEventWrapper(
      `${name}-option-updated`,
      this.#eventTarget
    );

    this.#storageKey = name;
    // make private member accessible in the callback.
    let storageKey = this.#storageKey;
    let thisOption = this;
    localStorage.get([storageKey], function (result) {
      thisOption.setCached(result[storageKey]);
    });

    localStorage.onChanged.addListener(function (changes) {
      if (changes[storageKey]) {
        thisOption.setCached(changes[storageKey].newValue);
      }
    });
  }

  /**
   * Get the cached value
   */
  getCached() {
    return this.#value;
  }

  /**
   * Set the value in the cache.
   * The value in the storage will not be affected.
   * @param {*} value new value
   */
  setCached(value) {
    if (Object.is(value, this.#value)) return;

    let oldValue = this.#value;
    this.#value = value;
    this.#onUpdatedEvent.trigger(value, oldValue);
  }

  /**
   * Set the value in the storage, the cached value will
   * be updated after setting.
   *
   * @param {*} value the new value
   * @param {function()} callback the callback after the setting is done,
   *  regardless if the value is changed.
   *  NOTE: to check if the value is changed, use function doOnUpdated()
   */
  set(value, callback = undefined) {
    if (Object.is(value, this.#value)) {
      callback && callback();
      return;
    }
    let val = {};
    val[this.#storageKey] = value;
    if (callback) localStorage.set(val, callback);
    else localStorage.set(val);
  }

  /**
   * Set callback when cached value is updated.
   *
   * This function can be used as a getter. In this case, if this.getCached() != undefined,
   * the callback be called immediately with parameters: (this.getCached(), undefined).
   *
   * NOTE: when value in the storage is updated, cached value will change accordingly.
   * Therefore, the callback will be triggered when value in the storage changed.
   *
   * @param {function(any, any)} callback the callback function on update
   *     - arg 0: the new value of the option
   *     - arg 1: the old value of the option
   * @param {boolean} asGetter whether or not call the callback with (current value, undefined)
   *    immediately.
   */
  doOnUpdated(callback, asGetter = true) {
    if (this.#value != undefined && asGetter) callback(this.#value, undefined);
    this.#onUpdatedEvent.addListener(callback);
  }
}

/**
 * A collection of options
 * The options can be accessed as properties
 */
class OptionCollection {
  #eventTarget = new EventTarget();

  /**
   * Create a option collection with the given options
   * @param  {...any} optionNames the option name to be included
   * @throws when optionNames contains option that is not in the allOptionNameList
   */
  constructor(...optionNames) {
    // remove duplication
    let optionSet = new Set(optionNames);

    for (const option of optionSet) {
      if (!ALL_OPTION_NAME_SET.has(option)) {
        throw new ReferenceError(`Referring invalid option: ${option}.`);
      }
      Object.defineProperty(this, option, {
        value: new OneOption(option, this.#eventTarget),
        writable: false,
      });
    }
  }

  /**
   * Get the option object
   * @param {string} name name of the option
   * @return {OneOption} the option object
   */
  getOption(name) {
    return this[name];
  }
}

export {
  ALL_OPTION_NAME,
  ALL_OPTION_NAME_SET,
  SYNC_OPTION_NAME,
  DEFAULT_OPTIONS,
  OptionCollection,
};
