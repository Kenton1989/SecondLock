import React from "react";

/**
 * A input element that will detect whether use hit "Enter" key.
 */
export default class EnterableInput extends React.Component {
  constructor(props) {
    super(props);

    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  render() {
    let props = Object.assign({}, this.props, {
      onKeyDown: this.handleKeyDown
    });
    delete props.onEnter;
    return (
        <input {...props} />
    );
  }

  handleKeyDown(e) {
    this.props.onKeyDown && this.props.onKeyDown(e);
    if (!e.defaultPrevented && this.props.onEnter && e.key === "Enter") {
      this.props.onEnter(e.target.value);
    }
  }
}
