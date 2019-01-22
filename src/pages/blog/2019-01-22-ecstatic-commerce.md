---
path: "/blog/2019-01-22-ecstatic-commerce"
title: "(Ec)static Commerce"
date: 2019-01-22
description: "Building a blazingly fast e-commerce site with Gatsby, Netlify, and Stripe."
background: "linear-gradient(to right, rgb(64, 32, 96) 0%, rgb(140, 101, 179) 100%)"
tags:
  - Stripe
  - GatsbyJS
  - E-commerce
  - Payments
---

## Why a static E-Commerce page?

[Gatsby](https://www.gatsbyjs.org/) has become a very popular tool for building fast, modern web experiences. It's delightful to work with (read [my previous post](/blog/2019-01-08-the-creation) for more details on that) which has caused its developer community and extension ecosystem to grow rapidly. I'm personally a big fan, and I think Gatsby has the potential to become as large as the WordPress community in the future.

WordPress has become an immensely popular platform for small to medium size e-commerce businesses, thanks to many niche plugins as well as the WooCommerce extension for WordPress which is a sizeable and profitable business both for the company behind WordPress and the developer community around it.

With Stripe's new [hosted Checkout](https://stripe.com/docs/payments/checkout/client_only) service offering, we can build a static e-commerce website without the need for a server-side component. To showcase this, I've created a [tutorial in the Gatsby documentation](https://www.gatsbyjs.org/docs/ecommerce-tutorial/) that takes you through different examples of accepting payments within your static website.

You can see a demo of this up and running [here](https://gatsby-ecommerce-stripe.netlify.com/) and the code for the examples is available on [GitHub](https://github.com/thorsten-stripe/ecommerce-gatsby-tutorial).

## The Gatsby e-Commerce tutorial

This new tutorial in the [Gatsby docs](https://www.gatsbyjs.org/docs/ecommerce-tutorial/) takes you in detail through [one easy](https://www.gatsbyjs.org/docs/ecommerce-tutorial/#easy-one-button) and one [advanced](https://www.gatsbyjs.org/docs/ecommerce-tutorial/#advanced-import-skus-via-source-plugin) use case.

## Deploying to Netlify and using build hooks

Netlify is our trusted partner in crime for deploying this. You can see a demo up an running [here](https://gatsby-ecommerce-stripe.netlify.com/). At build time, Gatsby calls the Stripe API to retireve our products and SKUs and then stores those as static content to improve site performance and to make sure we don't have to always ping Stripe for the product details.

This setup makes sense if your product catalogue doesn't change very often, since every time something changes we need to rebuild our page to pull in the new content from Stripe. A cool feature to automise this are [Netlify's build hooks](https://www.netlify.com/docs/webhooks/). Get your Netlify build hook URL and then register it as a webhook URL [within the Stripe Dashboard](https://dashboard.stripe.com/account/webhooks). Add a new endpoint, provide the Netlify build hook URL, and make sure to only select the `create`, `update`, and `delete` events for products and SKUs. With this set up, Stripe will call out to Netlify anytime something in your product catalogue changes and automatlically rebuilds your page to be up to date. How cool is that?!

## Live coding on Twitch

If you don't like reading the full tutorial, you can tune in on Thursday, **Jan 24 at 5pm GMT / 9am PT**, and follow along when [Jason Lengtsorf](https://twitter.com/jlengstorf) and I will be building a Gatsby e-commerce site live on [his Twitch channel](https://www.twitch.tv/jlengstorf). If you're reading this in the future, there is a recording available [here](https://www.youtube.com/playlist?list=PLz8Iz-Fnk_eTpvd49Sa77NiF8Uqq5Iykx).
