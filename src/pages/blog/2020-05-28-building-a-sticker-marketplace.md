---
path: "/blog/2020-05-28-building-a-sticker-marketplace"
title: "How I built a sticker marketplace in less than a week with Netlify & Stripe"
date: 2020-05-28
description: "Using Stripe Connect & Checkout I built a sticker marketplace on Netlify."
background: "linear-gradient(319deg, #fff179, #fb9ca4 44%, #a62ca3 140%)"
tags:
  - Stripe
  - Netlify
  - Marketplace
  - How I built this
---

## Inspiration & Motivation

At Stripe we've always been very gloabbly distributed with a good amount of folks [working remotely]() and now more than ever has our internal [Stripe Home](https://stripe.com/blog/stripe-home) become a crucial hub for everyone to stay up to date with whats happening across the org, as well as get to know their co-workers, e.g. everyone who joins Stripe uploads a little intro video about themselves so that everyone can (virtually) get to know them.

As part of Stripe Home we recently rolled out Badges as a non-monetary recognition and incentive program which show up on your home profile. This for example recognises folks who have mentored new starters, interviewed a large amount of candidates in a given quarter, or foster [community at Stripe](https://stripe.com/jobs/life-at-stripe).

To further grow our dogfooding culture at Stripe, we've rolled out the "Live Mode" badge which recognises Stripes' that run a live business on Stripe and therefore fully immerse themselves with our users. Another great side effect is that it provides a page with a collection of awesome businesses and projects that Stripes' have built. Recently I found myself browsing through this list and it motivated me to finally launch my own live Stripe integration. This is the story of "how I built this".

## Timing is key

I've been playing with the idea of creating and selling my own stickers for a while now, but I've never gone through with it. The "Live Mode" badge was one major incentive, the second came in the form of a collection of videos I made with [Jason Lengstorf]() from Netlify about doing business on the Jamstack. In [one of the episodes]() we built a [sticker store](https://www.learnwithjason.dev/store) for his https://www.learnwithjason.dev site, and Jason casually mentioned that I should make a hammer sticker, which wouldn't let me go. So when I came across http://sosplush.com/ (check out her seriously awesome stickers) and saw that she was open for commissions, everything fell into place. I messaged her on Twitter on Sunday night, she liked the idea. By Friday morning we had made our first sale on https://thorsticker.store/. What an exciting couple of days it was.

Now, when I first contacted SoSplush, my plan was to have her develop the cute Mjölnir character, then find a sticker printer, get some stickers printed, and then figure out fullfillment. Knowing that SoShplush sells here own awesome stickers, I asked her how she handles printing and fullfillment, and she mentioned that she had switched to printing them herself since the current COVID19 situation has temporarily halted many sticker producers. And that's when it hit me. Rather than selling the stickers myself, I should turn this into a platform with [Stripe Connect]() and outsource printing and fullfillment to the capable hands of others. And that's when I got to work.

## Setting up a Connect Marketplace

With SoSplush on board as the first seller, I went ahead and [created a new Stripe account](). Next, I turned my account into a platform account. That was something I hadn't done in a while, and I was happy to see that the Connect team had designed a guided onboarding experience that helped me choose the right marketplace setup for my scenario. I was going to use [Standard Connect]() and create the payments directly on SoPlush's Stripe account without taking any commission fees (I don't want to make money from this, I just want the awesome badge :)

Since I wouldn't be earning any money with this project (at leaft for the time being), it was important to find a way to get started without to much ongoing cost. This is where Netlify comes in, who have a more than generous free tier for both [hosting]() and [serverless functions]() so this was a no-brainer.

Next, I needed to connect SoSplush's Stripe account with my platform account, which happens via [OAuth](https://stripe.com/docs/connect/standard-accounts#oauth-flow). To kick off the OAuth process happens via a static link that includes your connect application ID. So after dropping my ID into the [Netlify environment settings]() I only needed a static page with a "Connect with Stripe" button ([view source](https://github.com/thorwebdev/thorstickerstore/blob/master/src/pages/Connect.js))

```jsx
import React from "react";

const oAuthURL = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.REACT_APP_STRIPE_CLIENT_ID}&scope=read_write`;

const Connect = () => {
  return (
    <a
      className="stripe-connect"
      href={oAuthURL}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>Connect with Stripe</span>
    </a>
  );
};

export default Connect;
```

After the account owner approves the connection, Stripe redirects them to a URL where you have to [finalise the connection](https://stripe.com/docs/connect/standard-accounts#token-request) with an authorisation code. For this I've set up a Netlify functions and set Stripe Connect to redirect to it.

## Checkout & Connect

## A note on scale

## What's next

currencies
store for sosplush
