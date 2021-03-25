import React, { useState } from "react";
import { render } from "react-dom";
import { api } from "../../common/api";
import { RemoteCallable } from "../../common/remote-callable";
import { $t } from "../../common/utility";
import CountdownTimer from "../components/countdown-timer";

let CurHostDisplay = (props) => {
  let curHost = "example.com";
  // try to parse the hostname
  if (props.curUrl)
    try {
      curHost = new URL(props.curUrl).hostname;
    } catch {
      console.warn("Got invalid URL:", props.curUrl);
    }

  return (
    <div>
      <p>{$t("currentHost")}</p>
      <p id="current-host">{curHost}</p>
    </div>
  );
};

class Popup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      curUrl: "",
      pageState: {
        isMonitored: false,
        monitoredHost: undefined,
        isUnlocked: undefined,
        unlockEndTime: undefined,
        needCalmDown: undefined,
        calmDownEndTime: undefined,
      },
    };

    // get URL of current page
    api.tabs.query({ active: true, currentWindow: true }).then(async (tabs) => {
      let url = tabs[0].url;
      // this.setState({ });
      // query the state
      let pageState = await RemoteCallable.call(
        "background-aux",
        "queryPageState",
        [url]
      );
      console.debug("update page state: ", pageState);
      this.setState({ curUrl: url, pageState: pageState });
    });

    this.stopAndClose = this.stopAndClose.bind(this);
  }

  render() {
    return (
      <div>
        <CurHostDisplay curUrl={this.state.curUrl} />
        <CountdownTimer endTime={this.state.pageState.unlockEndTime} />
        <button
          style={{ display: this.state.pageState.isMonitored ? "inline-block" : "none" }}
          onClick={this.stopAndClose}
        >
          {$t("stopTimingClose")}
        </button>
        <section id="links-div">
          <a
            href="./options.html"
            onClick={() => api.runtime.openOptionsPage()}
          >
            {$t("optionsTitle")}
          </a>
        </section>
      </div>
    );
  }

  stopAndClose() {
    if (!this.state.pageState.isMonitored) {
      return;
    }
    RemoteCallable.call("background-aux", "stopTimingAndClose", [
      this.state.pageState.monitoredHost,
    ]).then(window.close);
  }
}

export default Popup;
