import React, { Component } from "react";
import { $t } from "../../common/utility";
import HostList from "./host-list";

export default class MonitoredHost extends Component {
  constructor(props) {
    super(props);
    console.assert(props.options, "no options passed in");
    console.assert(props.options.monitoredList, "Missing blacklist option");
    console.assert(props.options.whitelistHost, "Missing whitelist option");

    this.state = {
      blacklist: [],
      whitelist: [],
    };
    this.setBlacklist = this.setBlacklist.bind(this);
    this.setWhitelist = this.setWhitelist.bind(this);
  }

  componentDidMount() {
    const { monitoredList, whitelistHost } = this.props.options;
    monitoredList.doOnUpdated(this.setBlacklist);
    whitelistHost.doOnUpdated(this.setWhitelist);
  }

  componentWillUnmount() {
    const { monitoredList, whitelistHost } = this.props.options;
    monitoredList.removeDoOnUpdated(this.setBlacklist);
    whitelistHost.removeDoOnUpdated(this.setWhitelist);
  }

  render() {
    const { options } = this.props;
    return (
      <div>
        <details className="description">
          <summary>{$t("moniListDetails")}</summary>
          <ul>
            <li>
              {$t("hostMatchRules")}
              <ul>
                <li> {$t("hostMatchRule1")}</li>
                <li> {$t("hostMatchRule2")}</li>
                <li> {$t("hostMatchRule3")}</li>
              </ul>
            </li>
            <li>
              {$t("hostEditRules")}
              <ul>
                <li> {$t("hostEditRule1")}</li>
                <li> {$t("hostEditRule2")}</li>
              </ul>
            </li>
            <li>{$t("whiteOverBlack")}</li>
          </ul>
        </details>
        <HostList
          title={$t("blacklist")}
          initList={this.state.blacklist}
          onSave={(val) => options.monitoredList.set(val)}
        />
        <HostList
          title={$t("whitelist")}
          initList={this.state.whitelist}
          onSave={(val) => options.whitelistHost.set(val)}
        />
      </div>
    );
  }

  setBlacklist(list) {
    this.setState({ blacklist: list });
  }

  setWhitelist(list) {
    this.setState({ whitelist: list });
  }
}
