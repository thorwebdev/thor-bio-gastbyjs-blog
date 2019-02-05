import React from "react";
import { withPrefix } from "gatsby";

const Ecstatic = () => {
  window.location.replace(withPrefix("/ecstatic-commerce.pdf"));
  return <span>Redirecting...</span>;
};

export default Ecstatic;
