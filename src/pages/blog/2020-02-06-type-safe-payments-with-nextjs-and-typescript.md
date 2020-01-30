---
path: "/blog/2020-02-06-type-safe-payments-with-nextjs-and-typescript"
title: "Type-safe Payments with Next.js & Typescript"
date: 2020-02-06
description: "Since version 8 stripe-node ships with types. Let's see how we can benefit from this when using Next.js with Typescript."
background: "linear-gradient(to right, rgb(0, 122, 204) 0%, rgb(255, 255, 255) 200%)"
tags:
  - Stripe
  - TypeScript
  - NextJS
  - Types
---

## Type-safe Payments with Next.js, TypeScript, and Stripe 🔒💸

In the 2019 StackOverflow survey, TypeScript has gained a lot of popularity, moving into the top ten of most popular programming languages.

As of 8.0.1, Stripe maintains types for the latest [API version](https://stripe.com/docs/api/versioning). Do note that in order to describe the correct API object shapes,

To enable this great developer experience & type safety across the stack, we have also added types to the newly released [react-stripe-js](https://github.com/stripe/react-stripe-js) library, which also follows the hooks pattern, to enable a delightful and modern developer experience. [Wes Bos]() has [called it "awesome"](https://github.com/wesbos/advanced-react-rerecord/issues/14#issuecomment-577756088) and has already moved his [Advanced React course]() over to it, and I hope you will also enjoy this updated experience soon 🙂

### Setting up a TypeScript project with Next.js

Setting up a TypeScript project with Next.js is quite convenient, as it automatically generates the `tsconfig.json` configuration file for us. You can follow the setup steps in the [docs](https://nextjs.org/learn/excel/typescript/setup) or start off with a more complete [example](https://github.com/zeit/next.js/tree/canary/examples/with-typescript). Of course you can also find the full [Stripe Sample](), that we'll be looking at in detail below, on [GitHub]().

### Managing API keys/secrets with Next.js

When working with API keys and secrets, we need to make sure we keep them secret and out of versioning control (make sure to add `.env` to your `.gitignore` file) while conveniently making them avaiable as `env` variables.

At the root of your project, add a `.env` file and provide the Stripe keys and secrets from your [Stripe Dashboard]():

```txt
# Stripe keys
STRIPE_PUBLISHABLE_KEY=pk_12345
STRIPE_SECRET_KEY=sk_12345
STRIPE_WEBHOOK_SECRET=whsec_1234
```

To make these variables available throughout our project, we will need to explicitly load them in the `next.config.js` file:

```js
const dotEnvResult = require("dotenv").config();

const parsedVariables = dotEnvResult.parsed || {};
const dotEnvVariables = {};
// We always want to use the values from process.env, since dotenv
// has already resolved these correctly in case of overrides
for (const key of Object.keys(parsedVariables)) {
  dotEnvVariables[key] = process.env[key];
}
module.exports = {
  env: {
    ...dotEnvVariables
  }
};
```

**_NOTE_**: Do make sure to only use `process.env.STRIPE_SECRET_KEY` in files that live within the `/pages/api` folder (and subfolders), since Next.js will replace the `env` variables with their respective values during build time.

### New loading utility for server-side rendered React applications.

Due to [PCI compliance requirements](), the Stripe.js library has to be loaded from Stripe's servers. This creates a challenge when working with server-side rendered apps, as the window object is not available on the server. To help you manage that complexity Stripe provides a [loading wrapper](https://github.com/stripe/stripe-js) that allows you to import Stripe.js like an ES module:

```js
import { loadStripe } from "@stripe/stripe-js";

const stripe = await loadStripe("pk_test_TYooMQauvdEDq54NiTphI7jx");
```

Stripe.js is loaded as a side effect of the `import '@stripe/stripe-js';` statement. To best leverage Stripe’s advanced fraud functionality, ensure that Stripe.js is loaded on every page, not just your checkout page. This allows Stripe to detect anomalous behavior that may be indicative of fraud as customers browse your website.

Since Next.js automatically performs [code-splitting](https://nextjs.org/#automatic-code-splitting), we need to make sure the import Stripe.js in the root app. To do so, wee need to add a `./pages/_app.js` file to customise the root app.

Finally, to use Element components and access the Stripe object in any nested component, we need to render an Elements provider at the root of our React app so that it is available everywhere we need it.

```js
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY);

function MyApp({ Component, pageProps }) {
  return (
    <Elements stripe={stripePromise}>
      <Component {...pageProps} />
    </Elements>
  );
}

export default MyApp;
```

### Handling custom amount input from the client-side

The reason why we generally need a server-side component to process payments is that we can't trust the input that is coming from the frontend. E.g. someone could open up the browser dev tools and modify the amount that the frontend sends to the backend. There always needs to be some server-side component to calculate/validate the amount that should be charged.

If you operate a pure static site (did someone say [JAMstack]()?), you can utilise Stripe's [client-only Checkout]() functionality. In this case you store your product details in Stripe, so Stripe itself can perform the server-side validation. You can see some examples of this using Gatsby on my [GitHub]().

Back to the topic at hand, in this example, we want to allow customers to specify a custom amount they want to donate, however we want to set some limits which we specify in `./config/index.ts`:

```ts
export const CURRENCY = "usd";
// Set your amount limits: Use float for decimal currencies and
// Integer for zero-decimal currencies: https://stripe.com/docs/currencies#zero-decimal.
export const MIN_AMOUNT = 10.0;
export const MAX_AMOUNT = 5000.0;
export const AMOUNT_STEP = 5.0;

const dev = process.env.NODE_ENV !== "production";
export const SERVER_URL = dev
  ? "http://localhost:3000"
  : "https://your_deployment.server.com";
```

With Next.js we can conveniently use the same config file for both our client-side and our server-side components. On the client we create a custom amount input field component which is defined in `./components/CustomDonationInput.tsx` and can be used like this:

```tsx
// Partial of ./components/CheckoutForm.tsx
// ...

  return (
    <form onSubmit={handleSubmit}>
      <CustomDonationInput
        name={"customDonation"}
        value={input.customDonation}
        min={config.MIN_AMOUNT}
        max={config.MAX_AMOUNT}
        step={config.AMOUNT_STEP}
        currency={config.CURRENCY}
        onChange={handleInputChange}
      />
      <button type="submit">
        Donate {formatAmountForDisplay(input.customDonation, config.CURRENCY)}
      </button>
    </form>
  );
};

export default CheckoutForm;
```

In our server-side component, we then validate the amount that was posted from the client:

```ts
// Partial of ./pages/api/checkout_sessions/index.ts
// ...

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const amount: number = req.body.amount;
    try {
      // Validate the amount that was passed from the client.
      if (!(amount >= MIN_AMOUNT && amount <= MAX_AMOUNT)) {
        throw new Error("Invalid amount.");
      }

// ...
```

### Format currencies for display and detect zero-decimal currencies

In JavaScript we can use the [`Intl.Numberformat` constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat) to correctly format amounts and currency symbols, as well as detect zero-Decimal currencies using the [`formatToParts` method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat/formatToParts). For this we create some helper methods in `./utils/stripe-helpers.ts`:

```ts
export function formatAmountForDisplay(
  amount: number,
  currency: string
): string {
  let numberFormat = new Intl.NumberFormat(["en-US"], {
    style: "currency",
    currency: currency,
    currencyDisplay: "symbol"
  });
  return numberFormat.format(amount);
}

export function formatAmountForStripe(
  amount: number,
  currency: string
): number {
  let numberFormat = new Intl.NumberFormat(["en-US"], {
    style: "currency",
    currency: currency,
    currencyDisplay: "symbol"
  });
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency: boolean = true;
  for (let part of parts) {
    if (part.type === "decimal") {
      zeroDecimalCurrency = false;
    }
  }
  return zeroDecimalCurrency ? amount : Math.round(amount * 100);
}
```

### Handling Webhooks
