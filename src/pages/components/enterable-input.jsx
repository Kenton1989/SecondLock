import React from "react";

/**
 * A input element that will detect whether use hit "Enter" key.
 */
export default class EnterableInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: props.value || "",
    };

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  render() {
    let props = Object.assign({ value: this.state.value }, this.props, {
      id: undefined,
      onKeyDown: this.handleKeyDown,
      onChange: this.handleChange
    });
    delete props.onEnter;
    return (
      <>
        <input {...props} />
      </>
    );
  }

  handleKeyDown(e) {
    this.props.onKeyDown && this.props.onKeyDown(e);
    if (this.props.onEnter && e.key === "Enter") {
      this.props.onEnter(e);
    }
  }

  handleChange(e) {
    this.props.onChange && this.props.onChange(e);
    this.setState({ value: e.target.value });
  }
}
