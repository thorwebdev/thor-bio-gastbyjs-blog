import React from "react";
import styled from "styled-components";
import tw from "tailwind.macro";
import { Parallax } from "react-spring/addons.cjs";

// Components
import Layout from "../../components/Layout";
import ProjectCard from "../../components/ProjectCard";

// Elements
import Inner from "../../elements/Inner";
import { Title, BigTitle, Subtitle } from "../../elements/Titles";

// Views
import Hero from "../../views/Hero";
import Projects from "../../views/Projects";
import About from "../../views/About";
import Contact from "../../views/Contact";

import avatar from "../../images/thor.jpg";

const ProjectsWrapper = styled.div`
  ${tw`flex flex-wrap justify-between mt-8`};
  display: grid;
  grid-gap: 4rem;
  grid-template-columns: repeat(2, 1fr);
  @media (max-width: 1200px) {
    grid-gap: 3rem;
  }
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    grid-gap: 2rem;
  }
`;

const AboutHero = styled.div`
  ${tw`flex flex-col lg:flex-row items-center mt-8`};
`;

const Avatar = styled.img`
  ${tw`rounded-full w-32 xl:w-48 shadow-lg h-auto`};
`;

const AboutSub = styled.span`
  ${tw`text-white pt-12 lg:pt-0 lg:pl-12 text-2xl lg:text-3xl xl:text-4xl`};
`;

const AboutDesc = styled.p`
  ${tw`text-grey-light text-lg md:text-xl lg:text-2xl font-sans pt-6 md:pt-12 text-justify`};
`;

const ContactText = styled.p`
  ${tw`text-grey-light font-sans text-xl md:text-2xl lg:text-3xl`};
`;

const Footer = styled.footer`
  ${tw`text-center text-grey absolute pin-b p-6 font-sans text-md lg:text-lg`};
`;

const Index = () => (
  <>
    <Layout />
    <Parallax pages={5}>
      <Projects>
        <Title>Blog</Title>
        <ProjectsWrapper>
          <ProjectCard
            title="Coming Soon"
            link="https://www.linkedin.com/in/tschaeff/"
            bg="linear-gradient(to right, #D4145A 0%, #FBB03B 100%)"
          >
            I'll be posting soon. In the meantime feel free to follow me on
            LinkedIn!
          </ProjectCard>
        </ProjectsWrapper>
      </Projects>
      <Contact>
        <Inner>
          <Title>Get in touch</Title>
          <ContactText>
            Find me online: <a href="https://twitter.com/thorwebdev">Twitter</a>{" "}
            | <a href="https://www.linkedin.com/in/tschaeff/">LinkedIn</a>
          </ContactText>
        </Inner>
        <Footer>
          &copy; 2018 by Gatsby Starter Portfolio Cara.{" "}
          <a href="https://github.com/LekoArts/gatsby-starter-portfolio-cara">
            Github Repository
          </a>
          . Made by <a href="https://www.lekoarts.de">LekoArts</a>.
        </Footer>
      </Contact>
    </Parallax>
  </>
);

export default Index;
