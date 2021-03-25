import React, { useState } from "react";
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

const Popup = () => {
  let [curUrl, setCurUrl] = useState("");
  let [pageState, setPageState] = useState({
    isMonitored: false,
    monitoredHost: undefined,
    isUnlocked: undefined,
    unlockEndTime: undefined,
    needCalmDown: undefined,
    calmDownEndTime: undefined,
  });

  // get URL of current page
  api.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    let url = tabs[0].url;
    setCurUrl(url);
    RemoteCallable.call("background-aux", "queryPageState", [url]).then(
      setPageState
    );
  });

  let stopAndClose = () =>
    pageState.isMonitored &&
    RemoteCallable.call("background-aux", "stopTimingAndClose", [
      pageState.monitoredHost,
    ]).then(window.close);

  return (
    <div>
      <CurHostDisplay curUrl={curUrl} />
      <CountdownTimer endTime={pageState.unlockEndTime} />
      <button
        style={{ display: pageState.isMonitored ? "inline-block" : "none" }}
        onClick={stopAndClose}
      >
        {$t("stopTimingClose")}
      </button>
      <section id="links-div">
        <a href="./options.html" onClick={() => api.runtime.openOptionsPage()}>
          {$t("optionsTitle")}
        </a>
      </section>
    </div>
  );
};

export default Popup;
