import React from "react";
import styled from "styled-components";
import tw from "tailwind.macro";
import { graphql } from "gatsby";

// Components
import Layout from "../../components/Layout";
import ProjectCard from "../../components/ProjectCard";

// Elements
import Inner from "../../elements/Inner";
import { Title } from "../../elements/Titles";

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

const Content = styled.div`
  ${tw`p-6 md:p-12 lg:p-24 justify-center items-center flex z-50`};
`;
const Bluesky = styled.div`
  ${tw`fixed w-full h-full`};
  background: linear-gradient(to right, SlateBlue 0%, DeepSkyBlue 100%);
  clip-path: polygon(0 5%, 100% 15%, 100% 95%, 0 85%);
`;

const Index = props => {
  const { data } = props;
  const { edges: posts } = data.allMarkdownRemark;

  return (
    <>
      <Layout />
      <>
        <Bluesky />
        <Content>
          <Inner>
            <Title>Blog</Title>
            <ProjectsWrapper>
              {posts.map(({ node: post }) => (
                <ProjectCard
                  key={post.id}
                  title={post.frontmatter.title}
                  link={post.frontmatter.path}
                  bg={post.frontmatter.background}
                >
                  {post.frontmatter.description}
                </ProjectCard>
              ))}
            </ProjectsWrapper>
          </Inner>
        </Content>
      </>
    </>
  );
};

export default Index;

export const pageQuery = graphql`
  query BlogQuery {
    allMarkdownRemark(
      sort: { order: DESC, fields: [frontmatter___date] }
      limit: 100
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
