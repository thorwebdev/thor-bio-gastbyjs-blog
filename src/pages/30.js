import React, { Component } from "react";

class Redirect extends Component {
  componentDidMount() {
    window.location.replace(
      `https://calendly.com/thorwebdev/30min`
    );
  }
  render() {
    return <span>Redirecting...</span>;
  }
}

export default Redirect;
