import React, { Component } from "react";
import { $t, asyncAlert } from "../../common/utility";
import MainUI from "../components/main-ui";
import { OptionCollection } from "../../common/options-manager";
import { dynamicInit } from "../js/dynamic-page";
import RemoteCallable from "../../common/remote-callable";
import { api } from "../../common/api";

let options = new OptionCollection("mottos");

export default class TimesUpPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      reminder: "",
      blockedHost: "",
      timesUpMsg: "the quick brown fox jumps over the lazy dog",
    };

    options.mottos.doOnUpdated((mottos) => {
      this.setState({ timesUpMsg: mottos[0] });
    });

    this.closeRelevant = this.closeRelevant.bind(this);
  }

  componentDidMount() {
    dynamicInit(({ blockedHost }) => {
      this.setState({ blockedHost });
    });

    api.storage.local.get("reminder").then(val =>
      this.setState(val)
    )
  }

  render() {
    let displayedHost = this.state.blockedHost || "example.com";
    let msg = this.state.timesUpMsg;
    if (this.state.reminder)
      msg = `${$t("reminder")}: ${this.state.reminder}`;

    return (
      <MainUI title={$t("timesUpTitle")}>

        <h1 id="motto-txt">{msg}</h1>
        <h3>{$t("timesUpWarn")}</h3>
        <p>
          <span className="blocked-link">{displayedHost}</span>{" "}
          {$t("timesUpDescribe")}
        </p>
        <button onClick={this.closeRelevant}>{$t("closeAllRelated")}</button>
      </MainUI>
    );
  }

  closeRelevant() {
    if (this.state.blockedHost) {
      RemoteCallable.call(
        "background-aux",
        "closeRelativePages",
        [this.state.blockedHost],
        false
      );
    } else {
      asyncAlert($t("noBlockedDetect"));
    }
  }
}
