---
path: "/blog/2019-01-08-the-creation"
title: "The Creation"
date: 2019-01-08
description: "This is a blog post about the creation of this blog 🧐 Topics: [GatsbyJS, React, GraphQL, Netlify]"
background: "linear-gradient(to right, #D4145A 0%, #FBB03B 100%)"
tags:
  - React
  - GatsbyJS
  - GraphQL
  - Personal
---

## Motivation

Inspired by [Dan Abramov's tweet](https://twitter.com/dan_abramov/status/1068884262273933312?lang=en), my recent urge to build something with [GatsbyJS](https://www.gatsbyjs.org/), and the availability of this awesome domain came together and birthed [Thor.News](https://thor.news), and let me tell you what a joyful journey it has been. Yes, actually that's the purpose of this, the very first, post on Thor.News.

## Getting started

There are a lot of great resources for getting started with GatsbyJS, namely the [Gatsby documentation](https://www.gatsbyjs.org/docs/quick-start) itself is extensive and includes many good tutorials. Quick warning though, this stuff is highly addictive, so proceed with caution! 😉

## The Design

As much as I'd love to take credit for the design, and some of my friendly reviewers have asked whether I was inspired by our beautiful [Stripe.com](https://stripe.com) marketing pages, all credit here goes to [LekoArts](https://www.lekoarts.de/) who has open-sourced this beautiful design as a [Gatsby Starter](https://github.com/LekoArts/gatsby-starter-portfolio-cara). Do have a look at some of his [other starters](https://github.com/LekoArts?utf8=%E2%9C%93&tab=repositories&q=gatsby-starter&type=&language=) which are all a great way to get started (it's in the name, folks!) with Gatsby.

The great thing about this starter is that it is using React-Spring, styled-components, and SVG animations, which were all on my "Dig-Deeper" list, so when I came across this, it was like a sign. Also, I personally learn best by dissecting and extending existing projects, so this was perfect for me. Thank you, Lennart, for this great starter! Extending it has brought me much joy and has allowed me to learn some new tricks as well 🙏.

## Adding Markdown rendering

While there are great Gatsby starters that give you blog functionality out of the box (check out [this one](https://github.com/netlify-templates/gatsby-starter-netlify-cms) which comes with an open-source, git-based CRM 🤯) I wanted to keep things light while at the same time learning what is going on under the hood.

Luckily there is a great tutorial on how to [add markdown pages](https://www.gatsbyjs.org/docs/adding-markdown-pages/), which takes you through the scripts needed to turn your markdown content into static pages, query them with GraphQL, and then render the content via a JSX template. You can see the changes I had to make in [this commit](https://github.com/tschaeff/thor-news-gastbyjs-blog/commit/11bb42888e321b45b67223c1e5423bc2a1e2ba7c).

Now that we have our markdown files turned into static content pages we can use Gatsby's GraphQL interface to query them. The `pageQuery` below queries all of our "markdown pages", sorts them by the date that's included in the [yaml metadata](https://github.com/tschaeff/thor-news-gastbyjs-blog/blob/master/src/pages/blog/2019-01-08-the-creation.md), and limits it to four results. This way we can have the four most recent posts available on the index page. The resulting data is injected into our `IndexPage` component via a `data` parameter on our component's `props`, nice!

```jsx
import React from "react";
import { graphql } from "gatsby";

const Index = props => {
  const { data } = props;
  const { edges: posts } = data.allMarkdownRemark;

  return <IndexPage />;
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
```

Since the index page only lists the four most recent posts we also need a sub-page [/blog](/blog) that lists all of our posts on a dedicated page. You can find the code for that page also on [GitHub](https://github.com/tschaeff/thor-news-gastbyjs-blog/blob/master/src/pages/blog/index.js). This page is very barebone for now (should be enough for this one post for now). Over time I plan on adding search functionality with [Algolia](https://algolia.com), for example.

Lastly, turns out our HTML doesn't style itself, so at this point the markdown turned HTML wasn't very readable. For now I've used the styling from the [Netlify CMS Gatsby starter](https://github.com/netlify-templates/gatsby-starter-netlify-cms), but that's also something I'm looking to improve over-time. For example the code snippet above could be a lot prettier. I'll have to look at how the Gatsby documentation does this.

## Deployment

### The love for Netlify is strong!

Deploying this project was a walk in the park thanks to [Netlify](https://netlify.com). This swiss army knife for modern web development is a blessing! All of this is running on a free account. I will need to figure out how to pay them, they definitely do deserve it!

Once connected with my GitHub account, Netlify watches the master branch of [my repo](https://github.com/tschaeff/thor-news-gastbyjs-blog). Therefore I only need to push my changes to GitHub and my site will automatically deploy with the changes made. It's magical!

### Getting a custom domain

I ended up buyng the domain via GoDaddy, mainly because I wasn't aware that Netlify also offers this service. Nonetheless, the configuration was super easy. I remember this being a lot more hassle (back in my LAMP days), so again, thank you Netlify!

### Setting up SSL

Have I told you that Netlify is amazing? Yah, well I'd write something here, but this simply came out of the box. And the best part, it even works with my custom GoDaddy domain. Out of the box! (No, I'm not getting paid for this!)

### Performance

Do open your Chrome dev tools, go to the audits tab and run it through Lighthouse! It's pretty good for the small effort I made so far. I mean, I'd post a picture of it here, but I haven't figured that part out yet 😂 (at least not how to get the pictures efficiently from the markdown references. Will have to take a peak on how Netlify CMS does that.)

## What's next?

This is just the beginning and the page is very much WIP, and I'm so excited to keep exteding it. For 2019 my goal is to learn & do more GraphQL related things, so likely the content here will centre around GraphQL (well, building and working with APIs in general), JavaScript (React, Node, Serveless), and payments (Stripe anyone? 😉).

If you find any bugs or glitches, please do send me a [tweet](https://twitter.com/thorwebdev), and even if you don't find any, I'd love to hear your thoughts 🙃
