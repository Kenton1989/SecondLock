import React, { Component } from "react";
import { $t, asyncAlert, reformatHostname } from "../../common/utility";
import EnterableInput from "../components/enterable-input";
import HostnameSet from "../../common/hostname-set";
import { handleWritingTooFast } from "../../common/options-manager";

let hasBits = (origin, mask) => (origin & mask) === mask;
let setBits = (origin, mask) => origin | mask;
let unsetBits = (origin, mask) => origin & ~mask;

const UNSAVED = 0x1;
const DELETED = 0x2;

function HostListItem(props) {
  let itemState = props.itemState || 0;

  let onStateChange = props.onStateChange || (() => {});

  let button = <button>Testing</button>;
  let hostStyle = "";
  if (hasBits(itemState, DELETED)) {
    hostStyle = "deleted";
    button = (
      <button
        onClick={() => {
          onStateChange(unsetBits(itemState, DELETED));
        }}
      >
        [{$t("undo")}]
      </button>
    );
  } else {
    button = (
      <button
        onClick={() => {
          onStateChange(setBits(itemState, DELETED));
        }}
      >
        [{$t("delete")}]
      </button>
    );
  }
  let tag = itemState > 0 && (
    <span className="unsaved-tag">{$t("unsavedHint")}</span>
  );

  return (
    <li className="host-list-item">
      <span className={hostStyle}>{props.host}</span>
      {tag}
      {button}
    </li>
  );
}

export default class HostList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hostList: undefined,
      userInput: "",
      itemState: undefined,
      dirty: false,
    };

    this.saveList = this.saveList.bind(this);
    this.addHost = this.addHost.bind(this);
  }

  render() {
    return (
      <div>
        <h3>{this.props.title}</h3>
        <div className="host-list-div">
          <ul className="host-list">{this.genItemList()}</ul>
          <div className="input-host-div">
            <EnterableInput
              type="text"
              className="host-input"
              placeholder={$t("enterNewHost")}
              value={this.state.userInput}
              onChange={(e) => this.setState({ userInput: e.target.value })}
              onEnter={this.addHost}
            />
            <button onClick={this.addHost} className="add-host-btn">
              ＋
            </button>
          </div>
        </div>
        <button onClick={this.saveList}>{$t("save")}</button>
      </div>
    );
  }

  genItemList() {
    let { dirty } = this.state;
    let hostList = dirty ? this.state.hostList : this.props.initList;
    hostList = [...hostList].sort((a, b) => a.localeCompare(b));

    return hostList.map((host) => (
      <HostListItem
        key={host}
        host={host}
        itemState={this.getItemState(host)}
        onStateChange={(state) => {
          this.setDirty(() => {
            let { itemState } = this.state;
            itemState.set(host, state);
            this.setState({ itemState });
          });
        }}
      />
    ));
  }

  setDirty(callback = undefined) {
    if (this.state.dirty) {
      callback && callback();
      return;
    }
    let { hostList, itemState } = this.state;
    itemState = new Map();

    if (hostList === undefined) hostList = this.getHostList();

    this.setState(
      {
        hostList: hostList,
        itemState: itemState,
        dirty: true,
      },
      callback
    );
  }

  getHostList() {
    let { dirty, hostList } = this.state;
    if (hostList === undefined) {
      console.assert(
        !dirty,
        "undefined host list must infer data is not dirty"
      );
      hostList = new HostnameSet(this.props.initList || []);
      this.setState({ hostList });
    }
    return hostList;
  }

  getItemState(key) {
    let { dirty, itemState } = this.state;
    if (!dirty) {
      return 0;
    } else {
      return itemState.get(key);
    }
  }

  addHost() {
    if (!this.state.userInput) {
      asyncAlert($t("emptyInputWarn"));
      return;
    }
    let hostname = reformatHostname(this.state.userInput, false);
    if (hostname === undefined) {
      asyncAlert($t("unknownHostFormatWarn"));
      return;
    }

    let hostList = this.getHostList();

    let matched = hostList.findSuffix(hostname);
    if (matched) {
      asyncAlert(`${$t("hostMonitoredWarn")} (${matched})`);
      return;
    }

    this.setDirty(() => {
      let { hostList, itemState } = this.state;
      hostList.add(hostname);
      itemState.set(hostname, UNSAVED);
      this.setState({
        userInput: "",
        hostList: hostList,
        itemState: itemState,
      });
    });
  }

  async saveList() {
    let { hostList, dirty } = this.state;

    if (!dirty) {
      console.log("the list is not modified, skip saving.");
      return;
    }

    let newHostList = [];
    for (const host of hostList) {
      let itemState = this.state.itemState.get(host);
      if (!hasBits(itemState, DELETED)) {
        newHostList.push(host);
      }
    }
    newHostList.sort((a, b) => a.localeCompare(b));

    try {
      this.props.onSave && (await this.props.onSave(newHostList));
    } catch (e) {
      handleWritingTooFast(e);
    }

    this.state.itemState.clear();
    this.setState({
      userInput: "",
      hostList: undefined,
      dirty: false,
    });
  }
}
