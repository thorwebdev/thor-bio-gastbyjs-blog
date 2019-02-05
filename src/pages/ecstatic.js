import React, { Component } from "react";
import { withPrefix } from "gatsby";

class Ecstatic extends Component {
  componentDidMount() {
    window.location.replace(withPrefix("/ecstatic-commerce.pdf"));
  }
  render() {
    return <span>Redirecting...</span>;
  }
}

export default Ecstatic;
