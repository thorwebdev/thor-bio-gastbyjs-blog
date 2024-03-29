import React from "react";
import styled from "styled-components";
import tw from "tailwind.macro";
import { Parallax } from "react-spring/addons.cjs";
import { Link, graphql } from "gatsby";

// Components
import Layout from "../components/Layout";
import ProjectCard from "../components/ProjectCard";
import ThorHammer from "../components/ThorHammer";

// Elements
import Inner from "../elements/Inner";
import { Title, BigTitle, Subtitle } from "../elements/Titles";
import Footer from "../elements/Footer";

// Views
import Hero from "../views/Hero";
import Projects from "../views/Projects";
import About from "../views/About";
import Contact from "../views/Contact";

import avatar from "../images/thor.jpg";

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

const Index = props => {
  const { data } = props;
  const { edges: posts } = data.allMarkdownRemark;

  return (
    <>
      <Layout />
      <ThorHammer />
      <Parallax pages={5}>
        <Hero>
          <BigTitle>
            Hello, <br /> I'm Thor
            <span style={{ whiteSpace: "nowrap" }}> 雷神</span>
          </BigTitle>
          <Subtitle>I help developers create.</Subtitle>
        </Hero>
        <Projects>
          <Link to="/blog">
            <Title>Blog</Title>
          </Link>
          <ProjectsWrapper>
            {posts.map(({ node: post }) => (
              <ProjectCard
                key={post.id}
                title={post.frontmatter.title}
                link={post.frontmatter.path}
                date={post.frontmatter.date}
                ttr={post.timeToRead}
                bg={post.frontmatter.background}
              >
                {post.frontmatter.description}
              </ProjectCard>
            ))}
          </ProjectsWrapper>
        </Projects>
        <About>
          <Title>About</Title>
          <AboutHero>
            <Avatar src={avatar} alt="Thorsten Schaeff" />
            <AboutSub>
              What I enjoy most about technology is enabling others to create. I love learning new things, and I learn best by teaching others. At Supabase we aim to make databases more accessible to all, with a delightful developer experience and a helpful and fun community. With Supabase you can build in a weekend, scale to millions!
            </AboutSub>
          </AboutHero>
        </About>
        <Contact>
          <Inner>
            <Title>Get in touch!</Title>
            <ContactText>
              Find me online:{" "}
              <a
                href="https://twitter.com/thorwebdev"
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter
              </a>{" "}
              |{" "}
              <a
                href="https://www.instagram.com/thorwebdev/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>{" "}
              |{" "}
              <a
                href="https://www.linkedin.com/in/thorwebdev/"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </ContactText>
          </Inner>
          <Footer />
        </Contact>
      </Parallax>
    </>
  );
};

export default Index;

export const pageQuery = graphql`
  query IndexQuery {
    allMarkdownRemark(
      sort: { order: DESC, fields: [frontmatter___date] }
      limit: 4
    ) {
      edges {
        node {
          id
          timeToRead
          frontmatter {
            path
            title
            description
            date(formatString: "MMMM DD, YYYY")
            background
          }
        }
      }
    }
  }
`;
