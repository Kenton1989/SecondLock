// import { useState } from "react";

import React, { useEffect } from "react";
import { api } from "../../common/api";
import {
  ALL_OPTION_NAME,
  OptionCollection,
} from "../../common/options-manager";
import { $t } from "../../common/utility";
import { MainWithNav, NavSection } from "../components/main-with-nav";
import MonitoredHost from "./monitored-host-setting";

const options = new OptionCollection(...ALL_OPTION_NAME);

export default function Options(props) {
  useEffect(() => checkDuplicatedOptionsPage());

  return (
    <MainWithNav title={$t("optionsTitle")}>
      <section>
        <a href="manual.html">{$t("manualTitle")}</a>
      </section>
      <NavSection id="monitored-host" title={$t("monitorHost")}>
        <MonitoredHost options={options} />
      </NavSection>
      <NavSection id="blocking-pages" title={$t("blockingOptionsTitle")}>
        <p>This is a section</p>
      </NavSection>
      <NavSection id="storage-and-sync" title={$t("storageAndSync")}>
        <p>{$t("cloudStorageUsed")} 0 KB/5 KB</p>
      </NavSection>
    </MainWithNav>
  );
}

const OPTIONS_PAGE_URL = api.runtime.getURL("options.html");

async function checkDuplicatedOptionsPage() {
  let tabs = await api.tabs.query({ url: OPTIONS_PAGE_URL });

  if (tabs.length <= 1) {
    console.debug("No duplicated options page detected.");
    return;
  }

  let trueOptionPage = tabs[0];
  for (const tab of tabs) {
    if (tab.id < trueOptionPage.id) trueOptionPage = tab;
  }

  let curTab = await api.tabs.getCurrent();
  if (curTab.id !== trueOptionPage.id) {
    window.alert($t("duplicatedOptionPageWarn"));
  }
  api.windows.update(trueOptionPage.windowId, {
    focused: true,
    drawAttention: true,
  });
  api.tabs.update(trueOptionPage.id, { active: true });

  let toClose = tabs.map((t) => t.id).filter((id) => id !== trueOptionPage.id);

  try {
    // if multiple options pages trigger removing
    // at the same time, this instruction is likely
    // to cause "tab not found exception".
    api.tabs.remove(toClose);
  } catch {}
}
