import React from "react";
import { api, apiName } from "../../common/api";
import { RemoteCallable } from "../../common/remote-callable";
import { $t } from "../../common/utility";
import CountdownTimer from "../components/countdown-timer";

let CurHostDisplay = (props) => {
  let curHost = "example.com";
  // try to parse the hostname
  if (props.curUrl) {
    try {
      curHost = new URL(props.curUrl).hostname;
    } catch {
      console.warn("Got invalid URL:", props.curUrl);
    }
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

    this.curTab = undefined;

    // get URL of current page
    api.tabs.query({ active: true, currentWindow: true }).then(async (tabs) => {
      if (tabs.length <= 0) return;

      let url = tabs[0].url;
      // this.setState({ });
      // query the state
      let pageState = await RemoteCallable.call(
        "background-aux",
        "queryPageState",
        [url]
      );

      this.curTab = tabs[0];
      this.setState({ curUrl: url, pageState: pageState });
    });

    if (apiName === "browser") {
      // load module only if firefox-like browser is used
      const onBrowsingPageChanged = require("../../common/browsing-page-change-event")
        .default;
      // handle the auto closing of popup
      onBrowsingPageChanged.addListener((tab) => {
        if (!this.curTab) return;
        if (this.curTab.windowId !== tab.windowId) {
          return;
        }
        if (this.curTab.id === tab.id && this.curTab.url === tab.url) {
          return;
        }
        window.close();
      });
    }

    this.stopAndClose = this.stopAndClose.bind(this);
  }

  render() {
    return (
      <div>
        <CurHostDisplay curUrl={this.state.curUrl} />
        <CountdownTimer endTime={this.state.pageState.unlockEndTime} />
        {this.state.pageState.isMonitored && (
          <button onClick={this.stopAndClose}>{$t("stopTimingClose")}</button>
        )}
        <section id="links-div">
          <a
            href="./options.html"
            onClick={() => {
              api.runtime.openOptionsPage();
              window.close();
            }}
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
