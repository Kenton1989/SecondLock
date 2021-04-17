import { api } from "./api";

/**
 * Default storage API to be used
 * @type {browser.storage.StorageArea} */
let defaultStorageApi = undefined;

// initialize the api
let storageSetUpProm = api.storage.local.get({ syncOn: true }).then((res) => {
  defaultStorageApi = res.syncOn ? api.storage.sync : api.storage.local;
});

api.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.syncOn) {
    defaultStorageApi = changes.syncOn.newValue
      ? api.storage.sync
      : api.storage.local;
  }
});

function genMethod(name) {
  return async (...param) => {
    await storageSetUpProm;
    return defaultStorageApi[name](...param);
  };
}

/**
 * a storage API wrapper.
 * the backing storage will change according to
 * the "syncOn" option in the local storage
 *
 * @type {browser.storage.StorageArea} */
const defaultStorage = {
  get: genMethod("get"),
  set: genMethod("set"),
  clear: genMethod("clear"),
  remove: genMethod("remove"),
};

/**
 * Switch the backing api of default storage
 * 
 * @param {boolean} useSync if sync storage should be used
 * @return {Promise<undefined>} promise returned after setting is done
 */
async function switchBackingStorageApi(useSync) {
  defaultStorageApi = useSync ? api.storage.sync : api.storage.local;
  await api.storage.local.set({ syncOn: useSync, lastSwitch: new Date(Date.now()) });
}

export { defaultStorage, switchBackingStorageApi };
