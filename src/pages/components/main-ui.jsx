import React from "react";
import { $t } from "../../common/utility.js";

export default class MainUI extends React.Component {
  render() {
    let thisYear = new Date(Date.now()).getFullYear();
    document.title = this.props.title;
    return (
      <div>
        <header>
          <h1>{$t("extName")}</h1>
          <h2>{this.props.title}</h2>
        </header>
        <main className="container">{this.props.children}</main>
        <footer>
          &copy;2021-{thisYear} Kenton. {$t("allRightsReserved")}
        </footer>
      </div>
    );
  }
}
