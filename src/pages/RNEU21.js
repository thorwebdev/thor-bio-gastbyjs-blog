import React, { Component } from "react";

class Gql extends Component {
  componentDidMount() {
    window.location.replace(
      `https://docs.google.com/presentation/d/e/2PACX-1vTLel30GAyBmwxtRPypP4zJylx7yJGxvEqHOXx7_1vLH22lSgcMS5XO2_YwrzmEaydFtA2K-NkDvy0A/pub?start=false&loop=false&delayms=60000`
    );
  }
  render() {
    return <span>Redirecting...</span>;
  }
}

export default Gql;
