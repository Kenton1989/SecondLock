import React, { useEffect, useState } from "react";
import { api } from "../../common/api";
import {
  ALL_OPTION_NAME,
  OptionCollection,
} from "../../common/options-manager";
import { $t } from "../../common/utility";
import { MainWithNav, NavSection } from "../components/main-with-nav";
import MonitoredHost from "./monitored-host-setting";
import PageBlocking from "./page-blocking-setting";
import SyncSetting from "./sync-setting";
import loadingIcon from "../images/loading.gif";

const options = new OptionCollection(...ALL_OPTION_NAME);

export default function Options(props) {
  const [enable, setEnable] = useState(true);
  const [blocked, setBlocked] = useState(false);

  let disablePage = () => setEnable(false);

  useEffect(() => checkDuplicatedOptionsPage(disablePage));

  return (
    enable && (
      <>
        {blocked && (
          <div className="front-blocker">
            <img src={loadingIcon} alt="loading animation" width="100px" />
            <p className="pause-msg">Loading...</p>
          </div>
        )}
        <MainWithNav title={$t("optionsTitle")}>
          {/* <section>
            <a href="manual.html">{$t("manualTitle")}</a>
          </section> */}
          <NavSection id="monitored-host" title={$t("monitorHost")}>
            <MonitoredHost options={options} />
          </NavSection>
          <NavSection id="page-blocking" title={$t("blockingOptionsTitle")}>
            <PageBlocking options={options} />
          </NavSection>
          <NavSection id="storage-and-sync" title={$t("storageAndSync")}>
            <SyncSetting options={options} />
          </NavSection>
        </MainWithNav>
      </>
    )
  );
}

const OPTIONS_PAGE_URL = api.runtime.getURL("options.html");

async function checkDuplicatedOptionsPage(disablePage) {
  let tabs = await api.tabs.query({ url: OPTIONS_PAGE_URL });

  if (tabs.length <= 1) {
    console.debug("No duplicated options page detected.");
    return;
  }
  disablePage();
  let trueOptionPage = tabs[0];
  for (const tab of tabs) {
    if (tab.id < trueOptionPage.id) trueOptionPage = tab;
  }

  let curTab = await api.tabs.getCurrent();
  if (curTab.id !== trueOptionPage.id) {
    window.alert($t("duplicatedOptionPageWarn"));
  }

  let toClose = tabs.map((t) => t.id).filter((id) => id !== trueOptionPage.id);

  api.tabs
    .update(trueOptionPage.id, { active: true })
    .then(() => {
      api.windows.update(trueOptionPage.windowId, {
        focused: true,
        drawAttention: true,
      });
    })
    .catch((res) => {
      console.warn(res);
      // it is possible that the window / tab to be reserved is closed before these code.
    });

  // if multiple options pages trigger removing
  // at the same time, this instruction is likely
  // to cause "tab not found exception".
  api.tabs.remove(toClose).catch((res) => {
    console.warn(res);
  });
}
