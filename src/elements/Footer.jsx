import React from "react";
import styled from "styled-components";
import tw from "tailwind.macro";
import { Link } from "gatsby";

const FooterStyle = styled.footer`
  ${tw`text-center text-grey fixed pin-b p-6 font-sans text-md lg:text-lg`};
`;

const Footer = () => (
  <FooterStyle>
    &copy; 2018 by Gatsby Starter Portfolio Cara | Made by{" "}
    <a href="https://www.lekoarts.de" target="_blank" rel="noopener noreferrer">
      LekoArts
    </a>
    , extended to <Link to="/blog">blog</Link> by{" "}
    <a href="http://thor.news">Thor (雷神)</a> | View sauce on{" "}
    <a
      href="https://github.com/tschaeff/thor-news-gastbyjs-blog"
      target="_blank"
      rel="noopener noreferrer"
    >
      GitHub
    </a>
  </FooterStyle>
);

export default Footer;
