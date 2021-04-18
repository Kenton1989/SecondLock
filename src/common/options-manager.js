import { api } from "../common/api";
import { CustomEventWrapper } from "./custom-event-wrapper";
import { defaultStorage, switchBackingStorageApi } from "./default-storage";
import { $t, asyncAlert } from "./utility";

const DEFAULT_LOCAL_OPTIONS = {
  syncOn: true,
  lastSwitch: new Date(0).toJSON(),
};

const DEFAULT_SHARED_OPTIONS = {
  lastModify: new Date(0).toJSON(),
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
  // activated: true,
  // notificationOn: false,
  // notificationTimes: [10, 60, 5 * 60],
  // activeDays: [0, 1, 2, 3, 4, 5, 6],
  leaveOneTab: true,
  defDurations: [1, 5, 10, 15, 30, 60],
  timesUpPageType: "default",
  mottos: [$t("defaultMotto")],
};

const DEFAULT_OPTIONS = Object.assign(
  {},
  DEFAULT_LOCAL_OPTIONS,
  DEFAULT_SHARED_OPTIONS
);
const READ_ONLY_OPTIONS = new Set(["syncOn", "lastSync", "lastModify"]);
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
      throw new Error(`Creating invalid option: ${name}.`);
    }

    this._value = undefined;
    this._eventTarget = eventTarget;
    this._onUpdatedEvent = new CustomEventWrapper(
      `${name}-option-updated`,
      this._eventTarget
    );
    this._storageKey = name;
    this._param = callbacks;

    let storageKey = this._storageKey;

    if (DEFAULT_LOCAL_OPTIONS[name] !== undefined) {
      this._storage = () => api.storage.local;
    }

    if (autoInit) {
      this._storage().get([storageKey]).then((result) => {
        this.setCached(result[storageKey]);
      });
    }

    if (autoUpdate) {
      api.storage.onChanged.addListener((changes) => {
        if (changes[storageKey]) {
          this.setCached(changes[storageKey].newValue);
        }
      });
    }

    if (READ_ONLY_OPTIONS.has(name)) {
      this.set = ()=>{throw Error(`option ${this._storageKey} is readonly.`)};
    }
  }

  _storage() {
    return defaultStorage;
  }

  /**
   * Get the cached value
   */
  getCached() {
    return this._value;
  }

  /**
   * Get the option from storage
   * 
   * @param {boolean} updateCache if the cached value should be updated after getting
   * @returns promise fulfilled with value get from storage
   */
  async get(updateCache = true) {
    let res = await this._storage().get([this._storageKey]);
    res = res[this._storageKey];
    if (updateCache) this.setCached(res);
    return res;
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
    let val = { lastModify: new Date(Date.now()).toJSON() };
    val[this._storageKey] = value;
    await this._storage().set(val);
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

    let localOptions = [], sharedOptions = [];
    for (const option of optionNames) {
      if (!ALL_OPTION_NAME_SET.has(option)) {
        throw new Error(`Referring invalid option: ${option}.`);
      }
      Object.defineProperty(this, option, {
        value: new OneOption(option, this._eventTarget, false, false),
        writable: false,
      });

      if (DEFAULT_LOCAL_OPTIONS[option]) {
        localOptions.push(option);
      } else {
        sharedOptions.push(option);
      }
    }

    // query the storage in bulk
    api.storage.local.get(localOptions).then((res) => {
      for (const key of localOptions) {
        this[key].setCached(res[key]);
      }
    });
    defaultStorage.get(sharedOptions).then((res) => {
      for (const key of sharedOptions) {
        this[key].setCached(res[key]);
      }
    });

    // listen to storage changes in bulk
    api.storage.onChanged.addListener((changes) => {
      for (const changedKey of Object.keys(changes)) {
        let option = this[changedKey];
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
    return this[name];
  }
}

/**
 * Assert that the given option collection contains
 * the given option name
 * @param {OptionCollection} options the option collection
 * @param  {...string} requiredOptions required options name
 */
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

/**
 * Switching the default storage space between local or sync
 *
 * @param {boolean} useSync If the sync storage space is used a default
 * @param {string} preference when contents in two storage conflict with each other,
 * which storage is preferred ("local" or "sync")
 * @returns promise fulfilled with undefined after the switching is finished. promise
 * will be rejected when some error happens
 */
async function syncAndSwitchStorage(useSync, preference) {
  let curSyncOn = await api.storage.local.get("syncOn");
  if (curSyncOn === useSync) return;
  
  if (preference === "local") {
    let content = await api.storage.local.get(DEFAULT_SHARED_OPTIONS);
    await api.storage.sync.set(content);
  } else if (preference === "sync") {
    let content = await api.storage.sync.get(DEFAULT_SHARED_OPTIONS);
    await api.storage.local.set(content);
  }

  await switchBackingStorageApi(useSync);
}

/**
 * Check if the error is caused by too frequent writing operations
 * and handle it. If not, pass the error
 * 
 * @param {Error} err the error to be handle
 */
const WRITE_OPERATION_KEYWORD = "WRITE_OPERATION";
function handleWritingTooFast(err) {
  if (err.message && err.message.indexOf(WRITE_OPERATION_KEYWORD) >= 0) {
    console.warn(err.message);
    asyncAlert($t("tooFrequentWritingAlert"));
  } else {
    throw err;
  }
}

export {
  ALL_OPTION_NAME,
  ALL_OPTION_NAME_SET,
  DEFAULT_OPTIONS,
  DEFAULT_LOCAL_OPTIONS,
  DEFAULT_SHARED_OPTIONS,
  OptionCollection,
  OneOption,
  assertOptions,
  syncAndSwitchStorage,
  handleWritingTooFast,
};
