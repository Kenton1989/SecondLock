import React, { Component } from "react";
import { api } from "../../common/api";
import {
  ALL_OPTION_NAME_SET,
  assertOptions,
  syncAndSwitchStorage,
} from "../../common/options-manager";
import { $t, asyncAlert, formatBytes } from "../../common/utility";

export default class SyncSetting extends Component {
  constructor(props) {
    super(props);
    assertOptions(props.options, "syncOn", "lastModify", "lastSwitch");

    this.state = {
      usedSyncSpace: 0,
      enableSync: true,
      disableSyncChange: false,
    };

    this.updateUsedSyncBytes = this.updateUsedSyncBytes.bind(this);
    this.updateEnableSync = this.updateEnableSync.bind(this);
    this.handleEnableSyncChange = this.handleEnableSyncChange.bind(this);
  }

  componentDidMount() {
    this.updateUsedSyncBytes();
    api.storage.onChanged.addListener(this.updateUsedSyncBytes);

    this.props.options.syncOn.doOnUpdated(this.updateEnableSync);
  }

  componentWillUnmount() {
    api.storage.onChanged.removeListener(this.updateUsedSyncBytes);
    this.props.options.syncOn.removeDoOnUpdated(this.updateEnableSync);
  }

  render() {
    // according to Mozilla's doc, their quota should be 102400 bytes
    // but they didn't put this quota in the API (2021 Apr. 19).
    let totalSpace = api.storage.sync.QUOTA_BYTES || 102400;
    let usedSpace = this.state.usedSyncSpace;
    let percentage = ((usedSpace / totalSpace) * 100).toFixed(2) + "%";

    let { enableSync, disableSyncChange } = this.state;

    return (
      <div>
        <input
          type="checkbox"
          name="sync-on"
          id="sync-on"
          checked={enableSync}
          disabled={disableSyncChange}
          onChange={this.handleEnableSyncChange}
        />
        <label htmlFor="sync-on">{$t("enableOptionSyncing")}</label>
        <p>
          {$t("cloudStorageUsed")} {formatBytes(usedSpace)}/
          {formatBytes(totalSpace)} ({percentage})
        </p>
      </div>
    );
  }

  async updateUsedSyncBytes() {
    let bytes = await api.storage.sync.getBytesInUse(null);
    this.setState({ usedSyncSpace: bytes });
  }

  updateEnableSync(newVal) {
    this.setState({ enableSync: newVal });
  }

  /**
   * handle the change event
   * @param {Event} e the change event
   */
  handleEnableSyncChange(e) {
    let handler;

    if (this.state.enableSync) {
      // handler for turning off syncing
      handler = async () => {
        let choice = window.confirm($t("areYouSureTurnSffSyncing"));
        if (choice) {
          await syncAndSwitchStorage(false, "sync");
          this.setState({ enableSync: false });
        }
      };
    } else {
      // handler for turing on syncing
      handler = async () => {
        let syncRes = await api.storage.sync.get("lastModify");
        let localRes = await api.storage.local.get([
          "lastSwitch",
          "lastModify",
        ]);
        let lastSyncModify = new Date(syncRes.lastModify);
        let lastLocalModify = new Date(localRes.lastModify);
        let lastSyncing = new Date(localRes.lastSwitch);

        // if no conflict happens, the local storage should be the preference
        let preference = "local";

        if (lastSyncing.getTime() < lastSyncModify.getTime()) {
          const PREFER_SYNC = "remote";
          const PREFER_LOCAL = "local";

          window.alert(`${$t("storageConflictDetected")}`);

          let input = window.prompt(
            `${$t("lastModifyTime")}:\n` +
              `${$t("localStorage")}: ${lastLocalModify.toLocaleString()}\n` +
              `${$t("remoteStorage")}: ${lastSyncModify.toLocaleString()}\n` +
              "=======================\n" +
              `${$t("pleaseEnterOneOfTheFollowingWord")}:\n` +
              `"${PREFER_SYNC}": ${$t("overwriteLocalWithRemote")}\n` +
              `"${PREFER_LOCAL}": ${$t("overwriteRemoteWithLocal")}\n`,
            lastLocalModify.getTime() < lastSyncModify.getTime()
              ? PREFER_SYNC
              : PREFER_LOCAL
          );

          // if no input
          if (input === null) {
            return;
          }

          if (input === PREFER_SYNC) {
            preference = "sync";
          } else if (input !== PREFER_LOCAL) {
            asyncAlert($t("invalidInput"));
            return;
          }
        }
        await syncAndSwitchStorage(true, preference);
      };
    }

    this.setState({ disableSyncChange: true }, () => {
      // run the handler as a microtask
      Promise.resolve()
        .then(handler)
        .then(() => this.setState({ disableSyncChange: false }));
    });
  }
}
