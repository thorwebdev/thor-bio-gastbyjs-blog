import React, { Component } from "react";

class Ecstatic extends Component {
  componentDidMount() {
    window.location.replace(
      `https://drive.google.com/file/d/1M_6YYruAKQUIFJ09VPcnEyUa0uTv-0WD/view?usp=sharing`
    );
  }
  render() {
    return <span>Redirecting...</span>;
  }
}

export default Ecstatic;
