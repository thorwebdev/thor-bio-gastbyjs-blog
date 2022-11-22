import React, { Component } from "react";

class Redirect extends Component {
  componentDidMount() {
    window.location.replace(
      `https://docs.google.com/presentation/d/e/2PACX-1vRJytMWa2d-vUzgvziniRrQv-pZcOqdDZsmCba1eRK9c5hvy8RRDEl5P8Ysjvbm9-6bKhsJSyJ_UlSL/pub?start=false&loop=false&delayms=3000`
    );
  }
  render() {
    return <span>Redirecting...</span>;
  }
}

export default Redirect;
