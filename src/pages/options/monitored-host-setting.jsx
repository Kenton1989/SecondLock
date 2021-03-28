import React, { Component } from "react";
import {
  ALL_OPTION_NAME,
  OptionCollection,
} from "../../common/options-manager";
import { $t } from "../../common/utility";
import HostList from "./host-list";

const options = new OptionCollection(...ALL_OPTION_NAME);

export default class MonitoredHost extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blacklist: [],
      whitelist: [],
    };
  }
  componentDidMount() {
    options.monitoredList.doOnUpdated((val) => {
      this.setState({ blacklist: val });
    });
    options.whitelistHost.doOnUpdated((val) => {
      this.setState({ whitelist: val });
    });
  }
  render() {
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
}
