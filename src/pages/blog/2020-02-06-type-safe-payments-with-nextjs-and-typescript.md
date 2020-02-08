---
path: '/blog/2020-02-06-type-safe-payments-with-nextjs-and-typescript'
title: 'Type-safe Payments with Next.js & Typescript'
date: 2020-02-06
description: "Since version 8 stripe-node ships with types. Let's see how we can benefit from this when using Next.js with Typescript."
background: 'linear-gradient(to right, rgb(0, 122, 204) 0%, rgb(255, 255, 255) 200%)'
tags:
  - Stripe
  - TypeScript
  - NextJS
  - Types
---

## Type-safe Payments with Next.js, TypeScript, and Stripe 🔒💸

- Demo: https://nextjs-typescript-react-stripe-js.now.sh/
- Code: https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript
- CodeSandbox: https://codesandbox.io/s/nextjs-typescript-react-stripe-js-ix23n

## Table of Contents

- [Setting up a TypeScript project with Next.js](#setting-up-a-typescript-project-with-nextjs)
- [Managing API keys/secrets with Next.js](#managing-api-keyssecrets-with-nextjs)
- [New Stripe.js loading utility for ESnext applications](#new-stripejs-loading-utility-for-esnext-applications)
- [Handling custom amount input from the client-side](#handling-custom-amount-input-from-the-client-side)
- [Format currencies for display and detect zero-decimal currencies](#format-currencies-for-display-and-detect-zero-decimal-currencies)
- [The useStripe Hook](#the-usestripe-hook)
- [Creating a CheckoutSession and redirecting to Stripe Checkout](#creating-a-checkoutsession-and-redirecting-to-stripe-checkout)
- [Taking card details on-site with Stripe Elements & PaymentIntents](#taking-card-details-on-site-with-stripe-elements--paymentintents)
- [Handling Webhooks & verifying their signature](#handling-webhooks--verifying-their-signature)

In the 2019 StackOverflow survey, TypeScript has gained a lot of popularity, moving into the top ten of the most popular programming languages.

As of 8.0.1, Stripe maintains types for the latest [API version](https://stripe.com/docs/api/versioning), giving you type errors, autocompletion for API fields and params, in-editor documentation, and much more!

To support this great developer experience across the stack, we have also added types to the newly released [react-stripe-js](https://github.com/stripe/react-stripe-js) library, which additionally follows the hooks pattern, to enable a delightful and modern developer experience. [Wes Bos]() has [called it "awesome"](https://github.com/wesbos/advanced-react-rerecord/issues/14#issuecomment-577756088) and has already moved his [Advanced React course]() over to it, and I hope you will also enjoy this updated experience soon 🙂

### Setting up a TypeScript project with Next.js

Setting up a TypeScript project with Next.js is quite convenient, as it automatically generates the `tsconfig.json` configuration file for us. You can follow the setup steps in the [docs](https://nextjs.org/learn/excel/typescript/setup) or start off with a more complete [example](https://github.com/zeit/next.js/tree/canary/examples/with-typescript). Of course you can also find the full example that we're looking at in detail below, on [GitHub](https://github.com/stripe-samples/nextjs-typescript-react-stripe-js).

### Managing API keys/secrets with Next.js & Zeit Now

When working with API keys and secrets, we need to make sure we keep them secret and out of versioning control (make sure to add `.env` to your [`.gitignore` file](https://github.com/thorsten-stripe/nextjs-typescript-react-stripe-js/blob/master/.gitignore#L1)) while conveniently making them avaiable as `env` variables.

At the root of your project, add a `.env` file and provide the Stripe keys and secrets from your [Stripe Dashboard](https://stripe.com/docs/development#api-keys):

```txt
# Stripe keys
STRIPE_PUBLISHABLE_KEY=pk_12345
STRIPE_SECRET_KEY=sk_12345
```

To make these variables available throughout our project, we will need to explicitly export them in the [`next.config.js` file](https://github.com/thorsten-stripe/nextjs-typescript-react-stripe-js/blob/master/next.config.js):

```js
require('dotenv').config();

module.exports = {
  env: {
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
  }
};
```

**_NOTE_**: Do make sure to only use `process.env.STRIPE_SECRET_KEY` in the API routes ([`/pages/api` folder](https://github.com/thorsten-stripe/nextjs-typescript-react-stripe-js/tree/master/pages/api) and subfolders), since Next.js will replace the `env` variables with their respective values during build time!

When we deploy our site with [Now](https://zeit.co/now), we will nedd to [add the secrets to our Now account](https://zeit.co/docs/v2/serverless-functions/env-and-secrets) using the CLI:

    now secrets add stripe_publishable_key pk_***
    now secrets add stripe_secret_key sk_***
    now secrets add stripe_webhook_secret whsec_***

Lastly, we need to add a [`now.json`](https://github.com/thorsten-stripe/nextjs-typescript-react-stripe-js/blob/master/now.json) file to make these secrets available as env variables during build time:

```json
{
  "build": {
    "env": {
      "STRIPE_PUBLISHABLE_KEY": "@stripe_publishable_key",
      "STRIPE_SECRET_KEY": "@stripe_secret_key",
      "STRIPE_WEBHOOK_SECRET": "@stripe_webhook_secret"
    }
  }
}
```

### New Stripe.js loading utility for ESnext applications

Due to [PCI compliance requirements](https://stripe.com/docs/security), the Stripe.js library has to be loaded from Stripe's servers. This creates a challenge when working with server-side rendered apps, as the window object is not available on the server. To help you manage that complexity, Stripe provides a [loading wrapper](https://github.com/stripe/stripe-js) that allows you to import Stripe.js like an ES module:

```js
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');
```

Stripe.js is loaded as a side effect of the `import '@stripe/stripe-js';` statement. To best leverage Stripe’s advanced fraud functionality, ensure that Stripe.js is loaded on every page of your customer's checkout journey, not just your checkout page. This allows Stripe to detect anomalous behavior that may be indicative of fraud as customers browse your website.

To make sure Stripe.js is loaded on all relevant pages, we create a [Layout component](https://github.com/thorsten-stripe/nextjs-typescript-react-stripe-js/blob/master/components/Layout.tsx) that loads and initialises Stripe.js and wraps our pages in an Elements provider so that it is available everywhere we need it:

```tsx
// Partial of components/Layout.tsx
// ...
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

type Props = {
  title?: string;
};

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);

const Layout: React.FunctionComponent<Props> = ({
  children,
  title = 'TypeScript Next.js Stripe Example'
}) => (
  <Elements stripe={stripePromise}>
    <Head>
    {/* ... */}
    </footer>
  </Elements>
);

export default Layout;
```

### Handling custom amount input from the client-side

The reason why we generally need a server-side component to process payments is that we can't trust the input that is posted from the frontend. E.g. someone could open up the browser dev tools and modify the amount that the frontend sends to the backend. There always needs to be some server-side component to calculate/validate the amount that should be charged.

If you operate a pure static site (did someone say [JAMstack](https://jamstack.org/)?!), you can utilise Stripe's [client-only Checkout](https://stripe.com/docs/payments/checkout/client-only) functionality. In this case create your product or subscription plan details in Stripe, so Stripe itself can perform the server-side validation. You can see some examples of this using Gatsby on my [GitHub](https://github.com/thorsten-stripe/ecommerce-gatsby-tutorial).

Back to the topic at hand: in this example, we want to allow customers to specify a custom amount that they want to donate, however we want to set some limits, which we specify in [`./config/index.ts`](https://github.com/thorsten-stripe/nextjs-typescript-react-stripe-js/blob/master/config/index.ts):

```ts
export const CURRENCY = 'usd';
// Set your amount limits: Use float for decimal currencies and
// Integer for zero-decimal currencies: https://stripe.com/docs/currencies#zero-decimal.
export const MIN_AMOUNT = 10.0;
export const MAX_AMOUNT = 5000.0;
export const AMOUNT_STEP = 5.0;
```

With Next.js we can conveniently use the same config file for both our client-side and our server-side (API routes) components. On the client we create a custom amount input field component which is defined in [`./components/CustomDonationInput.tsx`](https://github.com/thorsten-stripe/nextjs-typescript-react-stripe-js/blob/master/components/CustomDonationInput.tsx) and can be used like this:

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

In our [server-side component](https://github.com/thorsten-stripe/nextjs-typescript-react-stripe-js/blob/master/pages/api/checkout_sessions/index.ts#L18-L21), we then validate the amount that was posted from the client:

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

In JavaScript we can use the [`Intl.Numberformat` constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat) to correctly format amounts and currency symbols, as well as detect zero-Decimal currencies using the [`formatToParts` method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat/formatToParts). For this we create some helper methods in [`./utils/stripe-helpers.ts`](https://github.com/thorsten-stripe/nextjs-typescript-react-stripe-js/blob/master/utils/stripe-helpers.ts):

```ts
export function formatAmountForDisplay(
  amount: number,
  currency: string
): string {
  let numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol'
  });
  return numberFormat.format(amount);
}

export function formatAmountForStripe(
  amount: number,
  currency: string
): number {
  let numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol'
  });
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency: boolean = true;
  for (let part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
    }
  }
  return zeroDecimalCurrency ? amount : Math.round(amount * 100);
}
```

### The useStripe Hook

As part of the new [react-stripe-js](https://github.com/stripe/react-stripe-js) library, Stripe provides hooks (e.g. [`useStripe`](https://stripe.com/docs/stripe-js/react#usestripe-hook)) to retrieve references to the stripe and elements instances.

### Creating a CheckoutSession and redirecting to Stripe Checkout

[Stripe Checkout](https://stripe.com/checkout) is the fastest way to get started with Stripe and provides a stripe-hosted checkout page that comes with various payment methods and support for Apple Pay and Google Pay out of the box.

In our [`checkout_session` API route](https://github.com/thorsten-stripe/nextjs-typescript-react-stripe-js/blob/master/pages/api/checkout_sessions/index.ts#L22-L39) we create a CheckoutSession with the custom donation amount:

```ts
// Partial of ./pages/api/checkout_sessions/index.ts
// ...

// Create Checkout Sessions from body params.
const params: Stripe.Checkout.SessionCreateParams = {
  submit_type: 'donate',
  payment_method_types: ['card'],
  line_items: [
    {
      name: 'Custom amount donation',
      amount: formatAmountForStripe(amount, CURRENCY),
      currency: CURRENCY,
      quantity: 1
    }
  ],
  success_url: `${req.headers.origin}/result?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${req.headers.origin}/result?session_id={CHECKOUT_SESSION_ID}`
};
const checkoutSession: Stripe.Checkout.Session = await stripe.checkout.sessions.create(
  params
);

// ...
```

In our [client-side component](https://github.com/thorsten-stripe/nextjs-typescript-react-stripe-js/blob/master/components/CheckoutForm.tsx#L23-L47), we then use the CheckoutSession id to redirect to the Stripe hosted page:

```tsx
// Partial of ./components/CheckoutForm.tsx
// ...

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  // Create a Checkout Session.
  const checkoutSession: Stripe.Checkout.Session = await fetchPostJSON(
    '/api/checkout_sessions',
    { amount: input.customDonation }
  );

  if ((checkoutSession as any).statusCode === 500) {
    console.error((checkoutSession as any).message);
    return;
  }

  // Redirect to Checkout.
  const { error } = await stripe.redirectToCheckout({
    // Make the id field from the Checkout Session creation API response
    // available to this file, so you can provide it as parameter here
    // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
    sessionId: checkoutSession.id
  });
  // If `redirectToCheckout` fails due to a browser or network
  // error, display the localized error message to your customer
  // using `error.message`.
  console.warn(error.message);
};

// ...
```

Once the customer has completed (or canceled) the payment on the Stripe side, they will be redirected to our [`./pages/result.tsx`](https://github.com/thorsten-stripe/nextjs-typescript-react-stripe-js/blob/master/pages/result.tsx) page. Here we use the `useRouter` hook to access the CheckoutSession id, that was appended to our URL, to retrieve and print the CheckoutSession object.

Since we're using TypeScript, we can use some awesome ESnext language features like [optional chaining](https://github.com/tc39/proposal-optional-chaining#syntax) and the [nullish coalescing operator](https://github.com/tc39/proposal-nullish-coalescing#syntax) that are (at the time of writing) not yet available within JavaScript.

```tsx
// Partial of ./pages/result.tsx
// ...

const ResultPage: NextPage = () => {
  const router = useRouter();

  // Fetch CheckoutSession from static page via
  // https://nextjs.org/docs/basic-features/data-fetching#static-generation
  const { data, error } = useSWR(
    router.query.session_id
      ? `/api/checkout_sessions/${router.query.session_id}`
      : null,
    fetchGetJSON
  );

  if (error) return <div>failed to load</div>;

  return (
    <Layout title="Checkout Payment Result | Next.js + TypeScript Example">
      <h1>Checkout Payment Result</h1>
      <h2>Status: {data?.payment_intent?.status ?? 'loading...'}</h2>
      <p>
        Your Checkout Session ID:{' '}
        <code>{router.query.session_id ?? 'loading...'}</code>
      </p>
      <PrintObject content={data ?? 'loading...'} />
      <p>
        <Link href="/">
          <a>Go home</a>
        </Link>
      </p>
    </Layout>
  );
};

export default ResultPage;
```

### Taking card details on-site with Stripe Elements & PaymentIntents

### Handling Webhooks & verifying their signature
