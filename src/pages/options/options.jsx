// import { useState } from "react";

import React from "react";
import { $t } from "../../common/utility";
import { MainWithNav, NavSection } from "../components/main-with-nav";
import MonitoredHost from "./monitored-host-setting";

export default function Options(props) {
  return (
    <MainWithNav title={$t("optionsTitle")}>
      <section>
        <a href="manual.html">{$t("manualTitle")}</a>
      </section>
      <NavSection id="monitored-host" title={$t("monitorHost")}>
        <MonitoredHost/>
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
