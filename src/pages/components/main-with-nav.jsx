import React from "react";
import MainUI from "./main-ui";

import { $t } from "../../common/utility";

class MainWithNav extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      curSection: "",
    };
  }
  render() {
    return (
      <MainUI title={this.props.title}>
        <aside>
          <ul className="nav-list">
            {this.props.children.map(
              (ele) => ele.type === NavSection && this.makeItem(ele)
            )}
            {this.state.curSection !== "" && (
              <li key={""} onClick={() => this.setState({ curSection: "" })}>
                {$t("showAll")}
              </li>
            )}
          </ul>
        </aside>
        <div id="main-div">
          {this.props.children.map((ele) => this.shouldDisplay(ele) && ele)}
        </div>
      </MainUI>
    );
  }

  makeItem(ele) {
    let className = "";
    if (ele.props.id === this.state.curSection) {
      className = "highlight";
    }
    return (
      <li
        key={ele.props.id}
        onClick={() => this.setState({ curSection: ele.props.id })}
        className={className}
      >
        {ele.props.title}
      </li>
    );
  }

  shouldDisplay(ele) {
    if (this.state.curSection === "") {
      return true;
    }
    if (ele.type === NavSection && ele.props.id === this.state.curSection) {
      return true;
    }
    return false;
  }
}

class NavSection extends React.Component {
  constructor(props) {
    super(props);

    console.assert(this.props.id, "A section must have a id");
    console.assert(this.props.title, "A section must have a title");
  }
  render() {
    return (
      <section>
        <h2 className="section-title">{this.props.title}</h2>
        {this.props.children}
      </section>
    );
  }
}

export { MainWithNav, NavSection };
