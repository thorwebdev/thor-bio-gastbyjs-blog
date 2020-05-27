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

## Timing is key

I've been playing with the idea of creating and selling my own stickers for a while now, but I've never gone through with it. A couple weeks back I partnered with [Jason Lengstorf](https://twitter.com/jlengstorf) on a collection of videos about doing business on the Jamstack. In [one of the episodes](https://youtu.be/0fQPbiqG9bY) we built a [sticker store](https://www.learnwithjason.dev/store) for his https://www.learnwithjason.dev site, and Jason casually mentioned that I should make a hammer sticker, which wouldn't let me go. So when I came across http://sosplush.com/ (check out her seriously awesome stickers) and saw that she was open for commissions, everything fell into place. I messaged her on Twitter on Sunday night, she liked the idea, and by Friday morning we had made our first sale on https://thorsticker.store/. What an exciting couple of days this was.

When I first contacted SoSplush, my plan was to have her develop the cute Mjölnir character, then find a sticker printer, get some stickers printed, and then figure out fullfillment. Knowing that SoSplush sells here own awesome stickers, I asked her how she handles printing and fullfillment, and she mentioned that she had switched to printing them herself since the current COVID19 situation has temporarily halted many sticker producers. And that's when it hit me. Rather than selling the stickers myself, I should turn this into a marketplace with [Stripe Connect](https://stripe.com/connect) and outsource printing and fullfillment to the capable hands of others. And that's when I got to work.

## Setting up a Connect Marketplace

With SoSplush on board as the first seller, I went ahead and [created a new Stripe account](http://dashboard.stripe.com/register). Next, I turned my account into a platform account. That was something I hadn't done in a while, and I was happy to see that Stripe Connect now includes a guided onboarding experience that helped me choose the right marketplace setup for my scenario. I was going to use [Standard Connect](https://stripe.com/docs/connect/standard-accounts) and create the payments directly on SoPlush's Stripe account without taking any commission fees (I don't want to make money from this, I just want to see some cute Mjölnirs out there 😉)

Since I wouldn't be earning any money with this project (at least for the time being), it was important to find a way to get started without to much ongoing cost. This is where Netlify comes in - they have a more than [generous free tier](https://www.netlify.com/pricing/) for both building & hosting static sites, and serverless functions - exactly what I needed for this project.

Next, I had to connect SoSplush's Stripe account with my platform account, which happens via [OAuth](https://stripe.com/docs/connect/standard-accounts#oauth-flow). Kicking off the OAuth process happens via a static link that includes your connect application ID. So after dropping my ID into the [Netlify environment settings](https://www.netlify.com/blog/2020/04/13/learn-how-to-accept-money-on-jamstack-sites-in-38-minutes#use-netlify-environment-variables-for-local-development) I only needed a static page with a "Connect with Stripe" button ([view source](https://github.com/thorwebdev/thorstickerstore/blob/master/src/pages/Connect.js)).

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

After the account owner approves the connection, Stripe redirects them to a URL where you have to [finalise the connection](https://stripe.com/docs/connect/standard-accounts#token-request) with an authorisation code. For this I've set up a Netlify functions and set Stripe Connect to redirect to it ([view source](https://github.com/thorwebdev/thorstickerstore/blob/master/functions/connected.js)).

```js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-03-02",
  maxNetworkRetries: 2,
});

exports.handler = async ({ queryStringParameters }) => {
  let responseMessage = `Connection failed`;
  const { code } = queryStringParameters;

  if (code) {
    try {
      await stripe.oauth.token({
        grant_type: "authorization_code",
        code,
      });

      responseMessage = `Successfully connected`;
    } catch (error) {
      responseMessage = `${responseMessage}: ${error.message}`;
    }
  }

  return {
    statusCode: 200,
    body: responseMessage,
  };
};
```

## Checkout & Connect

With SoSplush' Stripe account connect, we were a real platform. To create CheckoutSession directly on the connected account, I will need to set an account header with their account ID, which is returned in the connection request from above. In a scalable marketplace scenario, you will want to store that account ID in your database. In my case, with only a small amount of sellers, I decided that I'll be fine with storing their account ID in an environment variable.

With only one product being sold on this site initially, I decided to hardcode the product information in my React app ([view source](https://github.com/thorwebdev/thorstickerstore/blob/master/src/App.js#L127-L162)). It includes two hidden input fields, one for the unique product identifier (here called sku for Stock Keeping Unit), and one for the seller id.

```jsx
<form onSubmit={handleSubmit}>
  <input type="hidden" name="sku" value="thorwebdev_standard" />
  <input type="hidden" name="seller" value="SOSPLUSH" />
  <div className="quantity-setter">
    <button
      type="button"
      className="increment-btn"
      disabled={state.quantity === 1}
      onClick={() => dispatch({ type: "decrement" })}
    >
      -
    </button>
    <input
      type="number"
      id="quantity"
      name="quantity"
      min="1"
      max="10"
      value={state.quantity}
      readOnly
    />
    <button
      type="button"
      className="increment-btn"
      disabled={state.quantity === 10}
      onClick={() => dispatch({ type: "increment" })}
    >
      +
    </button>
  </div>
  <button role="link" type="submit" disabled={state.loading}>
    {state.loading || !state.price ? `Loading...` : `Buy for ${state.price}`}
  </button>
</form>
```

When the form is being submitted, we send a POST request with the quantity, the sku ID, and the seller ID to another Netlify function to create a Checkout Session on SoSplush' Stripe account ([view source](https://github.com/thorwebdev/thorstickerstore/blob/master/functions/create-checkout.js)). In this function we retrieve the product's pricing information from a [JSON file](https://github.com/thorwebdev/thorstickerstore/blob/master/functions/data/products.json) and validate that the sent quantity is within our limits (1-10). Note that you should never blindly trust information coming from the client as it could have been tempered with. That's why we load the product data from a JSON file, or in a more scalable application from the database) and validate the quantity.

```js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-03-02",
  maxNetworkRetries: 2,
});

/*
 * Product data can be loaded from anywhere. In this case, we’re loading it from
 * a local JSON file, but this could also come from an async call to your
 * inventory management service, a database query, or some other API call.
 *
 * The important thing is that the product info is loaded from somewhere trusted
 * so you know the pricing information is accurate.
 */
const inventory = require("./data/products.json");
const shippingCountries = require("./data/shippingCountries.json");

exports.handler = async event => {
  const { sku, quantity, seller } = JSON.parse(event.body);
  const product = inventory.find(p => p.sku === sku);

  // ensure that the quantity is within the allowed range
  const validatedQuantity = quantity > 0 && quantity < 11 ? quantity : 1;

  const session = await stripe.checkout.sessions.create(
    {
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      shipping_address_collection: {
        allowed_countries: shippingCountries,
      },

      /*
       * This env var is set by Netlify and inserts the live site URL. If you want
       * to use a different URL, you can hard-code it here or check out the
       * other environment variables Netlify exposes:
       * https://docs.netlify.com/configure-builds/environment-variables/
       */
      success_url: `${process.env.URL}/success`,
      cancel_url: process.env.URL,
      line_items: [
        {
          name: product.name,
          description: product.description,
          images: [product.image],
          amount: product.amount,
          currency: product.currency,
          quantity: validatedQuantity,
        },
      ],
      // We are using the metadata to track which items were purchased.
      // We can access this meatadata in our webhook handler to then handle
      // the fulfillment process.
      // In a real application you would track this in an order object in your database.
      metadata: {
        items: JSON.stringify([
          {
            sku: product.sku,
            name: product.name,
            quantity: validatedQuantity,
          },
        ]),
      },
    },
    {
      stripeAccount: process.env[seller],
    }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      sessionId: session.id,
      stripeAccount: process.env[seller],
    }),
  };
};
```

After creating a Checkout Session on the connected account, the function returns the session ID as well as the seller account ID. These are the two IDs we need to initiate the redirect to Stripe Checkout from our client ([view source](https://github.com/thorwebdev/thorstickerstore/blob/master/src/App.js#L83-L118)).

```jsx
const handleSubmit = async event => {
  event.preventDefault();
  dispatch({ type: "setLoading", payload: { loading: true } });

  const form = new FormData(event.target);

  const data = {
    sku: form.get("sku"),
    seller: form.get("seller"),
    quantity: Number(form.get("quantity")),
  };
  console.log({ data });
  const { sessionId, stripeAccount } = await fetch(
    "/.netlify/functions/create-checkout",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  ).then(res => res.json());

  const stripe = await loadStripe(
    process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
    { stripeAccount }
  );
  const { error } = await stripe.redirectToCheckout({
    sessionId,
  });

  if (error) {
    alert(error.message);
    dispatch({ type: "setLoading", payload: { loading: false } });
  }
};
```

## Managing order fullfillment

Since we started off with one product and did not expect any flash sales like numbers (do feel free to prove me wrong 😉), fullfillment is being handled manually via email notifications from Stripe. In your [Stripe profile settings](https://dashboard.stripe.com/settings/user) you can enable to get an email notification anytime you make a sale. So anytime someone puts through an order SoSplush will receive an email notification from Stripe and then warm up the printing press.

## A note on shortcuts and scalability

As you probably noticed while reading, there were a couple of instances where I took some major shortcuts that will only work when you have a small amount of products, sellers, and orders. For example, I'm storing seller account IDs in the environment variables, and product data in a static JSON rather than a database. I'm also not tracking any inventory, which is fine as the small amount of orders we're expecting can be printed on demand, and fullfillment is handled manually via email notifcations and the Stripe Dashboard.

That being said, we were able to go from idea to first sale in less than a week with minimal upfront investment. When needed, I can add on a database for product and inventory management and for scalable seller management. I can extend my application with additional third-party APIs, or replace them with my own APIs as needed, but only when needed. For me, that's the beauty of the Jamstack with Netlify and Stripe to enable quickly testing your online business ideas.

## What's next

With a couple of sales in the "bank" (mainly from my American colleagues and friends), I'm looking to add multi-currency support for all my global friends, as well as adding some more payment methods.

SoSplush and I have also been talking about her own custom storefront to sell her amazing stickers and other products. Go check them out on http://sosplush.com/!

Lastly, I'd love to hear any feedback and suggestion you have, both on functionality for https://thorsticker.store/ or things you'd love to read and learn about. Please do reach out on [Twitter](https://twitter.com/thorwebdev) 🐦

{% twitter 1263535714777456640 %}
