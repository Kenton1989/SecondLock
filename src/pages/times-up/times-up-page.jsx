import React, { Component } from "react";
import { $t, asyncAlert } from "../../common/utility";
import MainUI from "../components/main-ui";
import { OptionCollection } from "../../common/options-manager";
import { dynamicInit } from "../js/dynamic-page";
import RemoteCallable from "../../common/remote-callable";

let options = new OptionCollection("mottos");

export default class TimesUpPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blockedHost: "",
      timesUpMsg: "the quick brown fox jumps over the lazy dog",
    };

    options.mottos.doOnUpdated((mottos) => {
      this.setState({ timesUpMsg: mottos[0] });
    });

    this.closeRelevant = this.closeRelevant.bind(this);
  }

  componentDidMount() {
    dynamicInit((args) => {
      this.setState({ blockedHost: args.blockedHost });
    });
  }

  render() {
    let displayedHost = this.state.blockedHost || "example.com";
    return (
      <MainUI title={$t("timesUpTitle")}>
        <h1 id="motto-txt">{this.state.timesUpMsg}</h1>
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
