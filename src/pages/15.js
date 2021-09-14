import React, { Component } from "react";

class Redirect extends Component {
  componentDidMount() {
    window.location.replace(
      `https://calendly.com/thorwebdev/15min`
    );
  }
  render() {
    return <span>Redirecting...</span>;
  }
}

export default Redirect;
