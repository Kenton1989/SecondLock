import React, { Component, useState } from "react";
import { $t, asyncAlert, reformatHostname } from "../../common/utility";
import EnterableInput from "../components/enterable-input";
import HostnameSet from "../../common/hostname-set";
import {
  ALL_OPTION_NAME,
  OptionCollection,
} from "../../common/options-manager";

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
  console.debug("item state", itemState)
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
      itemState: new Map()
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
    let itemState = this.state.itemState;
    let res = [];
    for (const host of this.state.hostList) {
      res.push(
        <HostListItem
          key={host}
          host={host}
          itemState={itemState.get(host)}
          onStateChange={(state) => {
            itemState.set(host, state);
            this.setState({ itemState: itemState });
          }}
        />
      );
    }
    return res;
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
    let itemState = this.state.itemState;

    let matched = hostList.findSuffix(hostname);
    if (matched) {
      asyncAlert(`${$t("hostMonitoredWarn")} (${matched})`);
      return;
    }

    hostList.add(hostname);
    itemState.set(hostname, UNSAVED);
    this.setState({
      userInput: "",
      hostList: hostList,
      itemState: itemState,
    });
  }

  async saveList() {
    let { hostList } = this.state;
    
    let newHostList = [];
    for (const host of hostList) {
      let itemState = this.state.itemState.get(host);
      if (!hasBits(itemState, DELETED)) {
        newHostList.push(host);
      }
    }

    this.props.onSave && (await this.props.onSave(newHostList));

    this.state.itemState.clear();
    this.setState({ userInput: "", hostList: new HostnameSet(newHostList) });
  }
}
