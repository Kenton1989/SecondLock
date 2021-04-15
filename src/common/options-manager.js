import { api } from "../common/api";
import { CustomEventWrapper } from "./custom-event-wrapper";
import { wait, unWait } from "../common/utility";

const DEFAULT_LOCAL_OPTIONS = {
  syncOn: true,
  lastSync: new Date(),
};

const DEFAULT_SHARED_OPTIONS = {
  lastModify: new Date(),
  monitoredList: [
    "bilibili.com",
    "facebook.com",
    "netflix.com",
    "reddit.com",
    "tiktok.com",
    "twitter.com",
    "wikipedia.org",
    "youtube.com",
    "zhihu.com",
  ],
  whitelistHost: [],
  activated: true,
  notificationOn: false,
  notificationTimes: [10, 60, 5 * 60],
  // activeDays: [0, 1, 2, 3, 4, 5, 6],
  leaveOneTab: true,
  defDurations: [1, 5, 10, 15, 30, 60],
  timesUpPageType: "default",
  mottos: ["Time waits for no one. – Folklore"],
};

const DEFAULT_OPTIONS = Object.assign(
  {},
  DEFAULT_LOCAL_OPTIONS,
  DEFAULT_SHARED_OPTIONS
);

const ALL_OPTION_NAME = Object.keys(DEFAULT_OPTIONS);
const ALL_OPTION_NAME_SET = new Set(ALL_OPTION_NAME);

/**
 * dummy function for class OneOption parameters
 * @param {string} optionName name of option
 */
function doNothing(optionName) {}

const DEFAULT_CALLBACKS = {
  // callback on store into storage fail
  onStoreFail: doNothing,

  // callback on retry set option into storage
  onStoreRetry: doNothing,

  // callback on set option into storage success
  onStoreSuccess: doNothing,
};

/**
 * Cache the value of the given option from the storage.
 * Notify all listener when the value of option updated.
 */
class OneOption {
  /**
   * construct a option with the given EventTarget object to
   * manage the option updating event
   * @param {String} name name of the option
   * @param {EventTarget} eventTarget the given event target
   * @param {boolean} autoInit whether this option should initialize themselves
   * @param {boolean} autoUpdate whether this options should update themselves
   * @param {*} callbacks callback used to control the behaviors of option
   *   the param will not be copied, modifying original param will
   */
  constructor(
    name,
    eventTarget = document,
    autoInit = true,
    autoUpdate = true,
    callbacks = DEFAULT_CALLBACKS
  ) {
    if (!ALL_OPTION_NAME_SET.has(name)) {
      throw new ReferenceError(`Create invalid option: ${name}.`);
    }

    this._value = undefined;
    this._eventTarget = eventTarget;
    this._onUpdatedEvent = new CustomEventWrapper(
      `${name}-option-updated`,
      this._eventTarget
    );
    this._storageKey = name;
    this._param = callbacks;

    // make private member accessible in the callback.
    let storageKey = this._storageKey;
    let thisOption = this;

    if (autoInit) {
      api.storage.local.get([storageKey]).then((result) => {
        thisOption.setCached(result[storageKey]);
      });
    }

    if (autoUpdate) {
      api.storage.onChanged.addListener((changes, area) => {
        if (area !== "local") return;
        if (changes[storageKey]) {
          thisOption.setCached(changes[storageKey].newValue);
        }
      });
    }
  }

  /**
   * Get the cached value
   */
  getCached() {
    return this._value;
  }

  /**
   * Set the value in the cache.
   * The value in the storage will not be affected.
   * @param {*} value new value
   */
  setCached(value) {
    if (Object.is(value, this._value)) return;

    let oldValue = this._value;
    this._value = value;
    this._onUpdatedEvent.trigger(value, oldValue);
  }

  /**
   * Set the value in the storage, the cached value will
   * be updated after setting.
   *
   * @param {*} value the new value
   *  NOTE: to check if the value is changed, use function doOnUpdated()
   * @returns {Promise} promise resolve with undefined after the setting is done,
   *  regardless if the value is changed.
   *  NOTE: to check if the value is changed, use function doOnUpdated()
   */
  async set(value) {
    if (Object.is(value, this._value)) {
      return;
    }
    let val = {};
    val[this._storageKey] = value;
    await api.storage.local.set(val);
  }

  /**
   * Set the value options after a given length of delay
   * Used to avoid frequent repeating setting.
   *
   * @param {*} value the new value
   * @param {number} delay the delay in milliseconds
   * @returns {Promise} a promise resolved after setting is done.
   */
  delayedSet(value, delay = 500) {
    if (this._pendingWait !== undefined) {
      unWait(this._pendingWait);
    }
    this._pendingWait = wait(delay);

    let thisOption = this;
    return this._pendingWait.then(() => {
      thisOption.set(value);
      delete thisOption._pendingWait;
    });
  }

  /**
   * Set callback when cached value is updated.
   *
   * This function can be used as a getter. In this case, if this.getCached() !== undefined,
   * the callback be called immediately with parameters: (this.getCached(), undefined).
   *
   * NOTE: when value in the storage is updated, cached value will change accordingly.
   * Therefore, the callback will be triggered when value in the storage changed.
   *
   * @param {function(any, any)} callback the callback function on update
   *     - arg 0: the new value of the option
   *     - arg 1: the old value of the option
   * @param {boolean} asGetter whether or not call the callback with (current cached value, undefined)
   *    immediately.
   */
  doOnUpdated(callback, asGetter = true) {
    if (this._value !== undefined && asGetter) callback(this._value, undefined);
    this._onUpdatedEvent.addListener(callback);
  }

  /**
   * Remove a callback added through this.doOnUpdated(function)
   *
   * @param {function(any, any)} callback the callback function to be removed
   */
  removeDoOnUpdated(callback) {
    this._onUpdatedEvent.removeListener(callback);
  }
}

/**
 * A collection of options
 * The options can be accessed as properties
 */
class OptionCollection {
  /**
   * Create a option collection with the given options
   * @param  {...string} optionNames the option name to be included
   * @throws when optionNames contains option that is not in the allOptionNameList
   */
  constructor(...optionNames) {
    this._eventTarget = new EventTarget();

    // remove duplication
    let optionSet = new Set(optionNames);
    optionNames = [...optionSet];

    for (const option of optionNames) {
      if (!ALL_OPTION_NAME_SET.has(option)) {
        throw new ReferenceError(`Referring invalid option: ${option}.`);
      }
      Object.defineProperty(this, option, {
        value: new OneOption(option, this._eventTarget, false, false),
        writable: false,
      });
    }

    // avoid ambiguity of "this"
    let thisOptions = this;

    // query the storage in bulk
    api.storage.local.get(optionNames).then((res) => {
      for (const key of optionNames) {
        thisOptions[key].setCached(res[key]);
      }
    });

    // listen to storage changes in bulk
    api.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      for (const changedKey of Object.keys(changes)) {
        let option = thisOptions[changedKey];
        if (option) {
          option.setCached(changes[changedKey].newValue);
        }
      }
    });
  }

  /**
   * Get the option object
   * @param {string} name name of the option
   * @return {OneOption} the option object
   */
  getOption(name) {
    if (!ALL_OPTION_NAME_SET.has(name)) {
      throw new ReferenceError(`Referring invalid option: ${name}.`);
    }
    return this[name];
  }
}

function assertOptions(options, ...requiredOptions) {
  console.assert(
    options instanceof OptionCollection,
    "Missing OptionCollection object"
  );
  for (const name of requiredOptions) {
    console.assert(
      ALL_OPTION_NAME_SET.has(name),
      `Requiring unknown options: ${name}`
    );
    console.assert(options[name], `Missing required option: ${name}`);
  }
}

// TODO - sync options every 5 seconds
window.setInterval(() => {}, 5000);

export {
  ALL_OPTION_NAME,
  ALL_OPTION_NAME_SET,
  DEFAULT_OPTIONS,
  OptionCollection,
  OneOption,
  assertOptions,
};
