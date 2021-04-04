import React, { Component } from "react";
import { api } from "../../common/api";
import { $t, formatBytes } from "../../common/utility";

export default class SyncSetting extends Component {
  constructor(props) {
    super(props);

    this.state = {
      usedSyncSpace: 0,
    };

    this.updateUsedSyncSpace = this.updateUsedSyncSpace.bind(this);

    this.updateUsedSyncSpace();

  }
  
  componentDidMount() {
    api.storage.onChanged.addListener(this.updateUsedSyncSpace);
  }

  componentWillUnmount() {
    api.storage.onChanged.removeListener(this.updateUsedSyncSpace);
  }

  render() {
    let usedSpace = this.state.usedSyncSpace;
    let totalSpace = api.storage.sync.QUOTA_BYTES;
    let percentage = (usedSpace / totalSpace * 100).toFixed(2) + "%";

    return (
      <div>
        <p>
          {$t("cloudStorageUsed")} {formatBytes(usedSpace)}/
          {formatBytes(totalSpace)} ({percentage})
        </p>
      </div>
    );
  }

  async updateUsedSyncSpace() {
    let bytes = await api.storage.sync.getBytesInUse(null);
    this.setState({ usedSyncSpace: bytes });
  }
}
