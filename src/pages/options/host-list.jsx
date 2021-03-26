import React, { Component } from "react";
import { $t } from "../../common/utility";
import EnterableInput from "../components/enterable-input";

export default class HostList extends Component {
  constructor(props) {
    super(props);

    this.saveList = this.saveList.bind(this);
  }

  render() {
    return (
      <div>
        <h3>{this.props.title}</h3>
        <div className="host-list-div">
          <ul className="host-list"></ul>
          <div className="input-host-div">
            <EnterableInput
              type="url"
              className="host-input"
              placeholder={$t("enterNewHost")}
            />
            <button className="add-host-btn">＋</button>
          </div>
        </div>
        <button onClick={this.saveList}>{$t("save")}</button>
      </div>
    );
  }
  saveList() {}
}
