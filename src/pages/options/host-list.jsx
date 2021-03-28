import React, { Component } from "react";
import { $t, asyncAlert, reformatHostname } from "../../common/utility";
import EnterableInput from "../components/enterable-input";
import HostnameSet from "../../common/hostname-set";

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
      hostList: new HostnameSet(props.initList || []),
      userInput: "",
      itemState: new Map(),
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
    let { itemState, dirty } = this.state;
    let hostList = dirty ? this.state.hostList : this.props.initList;
    hostList = [...hostList].sort((a, b) => a.localeCompare(b));
    let res = [];
    for (const host of hostList) {
      let state = dirty ? itemState.get(host) || 0 : 0;
      res.push(
        <HostListItem
          key={host}
          host={host}
          itemState={state}
          onStateChange={(state) => {
            this.setDirty();
            itemState.set(host, state);
            this.setState({ itemState: itemState });
          }}
        />
      );
    }
    return res;
  }

  setDirty(callback = undefined) {
    if (this.state.dirty) {
      callback && callback();
      return;
    }
    let hostList = new HostnameSet(this.props.initList);
    let itemState = new Map();
    this.setState(
      {
        hostList: hostList,
        itemState: itemState,
        dirty: true,
      },
      callback
    );
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

    let { hostList } = this.state;

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

    this.props.onSave && (await this.props.onSave(newHostList));

    this.state.itemState.clear();
    this.setState({
      userInput: "",
      hostList: new HostnameSet(newHostList),
      dirty: false,
    });
  }
}
