import React from "react";
import styled from "styled-components";

const Hammer = styled.a`
  cursor: pointer;
  display: block;
  width: 228px;
  height: 242px;
  top: 1em;
  margin-left: 1em;
  background-image: url("https://thorsticker-store.netlify.app/static/media/logo.6bfe1b4e.svg");
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  position: fixed;
  z-index: 51;
  @media (max-width: 900px) {
    width: 114px;
    height: 121px;
    right: 1em;
  }
`;

const ThorHammer = () => {
  return (
    <Hammer
      href="https://thorsticker-store.netlify.app"
      target="_blank"
      rel="noopener noreferrer"
    />
  );
};

export default ThorHammer;
