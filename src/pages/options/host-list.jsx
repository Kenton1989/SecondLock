import React, { Component } from "react";
import { $t, asyncAlert, reformatHostname } from "../../common/utility";
import EnterableInput from "../components/enterable-input";
import HostnameSet from "../../common/hostname-set";

const EMPTY = new Set();

export default class HostList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hostList: new HostnameSet(props.initList || []),
      itemState: new Map(),
      userInput: "",
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
    let res = [];
    let itemState = this.state.itemState;
    for (const host of this.state.hostList) {
      let classes = itemState.get(host) || new Set();
      let button = <button />;

      if (classes.has("deleted")) {
        button = (
          <button onClick={this.genStateDel("deleted")}>[{$t("undo")}]</button>
        );
      } else {
        button = (
          <button onClick={this.genStateAdd("deleted")}>
            [{$t("delete")}]
          </button>
        );
      }

      let clsStr = `host ${[...classes].join(" ")}`;

      let item = (
        <li key={host} className="host-list-item">
          <span className={clsStr}>{host}</span>
          {button}
        </li>
      );

      res.push(item);
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
    let { hostList, itemState } = this.state;
    let matched = hostList.findSuffix(hostname);
    if (matched) {
      asyncAlert(`${$t("hostMonitoredWarn")} (${matched})`);
      return;
    }

    hostList.add(hostname);
    itemState.set(hostname, new Set(["unsaved"]));
    this.setState({
      userInput: "",
      hostList: hostList,
      itemState: itemState,
    });
  }

  genStateAdd(host, state) {
    let itemState = this.state.itemState;
    return () => {
      let classes = itemState.get(host) || new Set();
      if (!itemState.has(host)) {
        itemState.set(host, classes);
      }
      if (!classes.has(state)) {
        classes.add(state);
        this.setState({ itemState: itemState });
      }
    };
  }

  genStateDel(host, state) {
    let itemState = this.state.itemState;
    return () => {
      let classes = itemState.get(host);
      if (classes && classes.has(state)) {
        classes.delete(state);
        this.setState({ itemState: itemState });
      }
    };
  }

  saveList() {}
}
