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
- CodeSandbox: https://codesandbox.io/s/nextjs-typescript-react-stripe-js-rqrss

## Table of Contents

- [Setting up a TypeScript project with Next.js](#setting-up-a-typescript-project-with-nextjs)
- [Managing API keys/secrets with Next.js & Zeit Now](#managing-api-keyssecrets-with-nextjs--zeit-now)
- [Stripe.js loading utility for ESnext applications](#stripejs-loading-utility-for-esnext-applications)
- [Handling custom amount input from the client-side](#handling-custom-amount-input-from-the-client-side)
- [Format currencies for display and detect zero-decimal currencies](#format-currencies-for-display-and-detect-zero-decimal-currencies)
- [The useStripe Hook](#the-usestripe-hook)
- [Creating a CheckoutSession and redirecting to Stripe Checkout](#creating-a-checkoutsession-and-redirecting-to-stripe-checkout)
- [Taking card details on-site with Stripe Elements & PaymentIntents](#taking-card-details-on-site-with-stripe-elements--paymentintents)
- [Handling Webhooks & checking their signatures](#handling-webhooks--checking-their-signatures)
- [Deploy it to the cloud with Zeit Now](#deploy-it-to-the-cloud-with-zeit-now)

In the [2019 StackOverflow survey](https://insights.stackoverflow.com/survey/2019), TypeScript has gained a lot of popularity, moving into the top ten of the most popular and most loved languages.

As of version 8.0.1, Stripe maintains types for the latest [API version](https://stripe.com/docs/api/versioning), giving you type errors, autocompletion for API fields and params, in-editor documentation, and much more!

To support this great developer experience across the stack, Stripe has also added types to the [react-stripe-js](https://github.com/stripe/react-stripe-js) library, which additionally follows the hooks pattern, to enable a delightful and modern developer experience. Friendly Canadian Fullstack Dev [Wes Bos](https://twitter.com/wesbos) has [called it "awesome"](https://github.com/wesbos/advanced-react-rerecord/issues/14#issuecomment-577756088) and has already moved his [Advanced React course](https://advancedreact.com/) over to it, and I hope you will also enjoy this delightful experience soon 🙂

Please do [tweet at me](https://twitter.com/thorwebdev) with your questions and feedback!

Alrighty, let's get into it ⚡️

### Setting up a TypeScript project with Next.js

Setting up a TypeScript project with Next.js is quite convenient, as it automatically generates the [`tsconfig.json`](https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript/tsconfig.json) configuration file for us. You can follow the setup steps in the [docs](https://nextjs.org/learn/excel/typescript/setup) or start off with a more complete [example](https://github.com/zeit/next.js/tree/canary/examples/with-typescript). Of course you can also find the full example that we're looking at in detail below, on [GitHub](https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript).

### Managing API keys/secrets with Next.js & Zeit Now

When working with API keys and secrets, we need to make sure we keep them secret and out of version control (make sure to add `.env` to your [`.gitignore` file](https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript/.gitignore#L1)) while conveniently making them available as `env` variables.

At the root of our project we add a `.env` file and provide the Stripe keys and secrets from our [Stripe Dashboard](https://stripe.com/docs/development#api-keys):

```txt
# Stripe keys
STRIPE_PUBLISHABLE_KEY=pk_12345
STRIPE_SECRET_KEY=sk_12345
```

To make these variables available throughout our project, we will need to explicitly export them in the [`next.config.js` file](https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript/next.config.js):

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

**_NOTE_**: Do make sure to only use secrets in the API routes ([`/pages/api` folder](https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript/pages/api) and subfolders), since Next.js will replace the `env` variables with their respective values during build time! The publishable key can be included in any of our client-side components.

When we deploy our site with [Now](https://zeit.co/now), we will need to [add the secrets to our Now account](https://zeit.co/docs/v2/serverless-functions/env-and-secrets) using the CLI:

    now secrets add stripe_publishable_key pk_***
    now secrets add stripe_secret_key sk_***
    now secrets add stripe_webhook_secret whsec_***

Lastly, we need to add a [`now.json`](https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript/now.json) file to make these secrets available as env variables during build time:

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

### Stripe.js loading utility for ESnext applications

Due to [PCI compliance requirements](https://stripe.com/docs/security), the Stripe.js library has to be loaded from Stripe's servers. This creates a challenge when working with server-side rendered apps, as the window object is not available on the server. To help you manage that complexity, Stripe provides a [loading wrapper](https://github.com/stripe/stripe-js) that allows you to import Stripe.js like an ES module:

```js
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');
```

Stripe.js is loaded as a side effect of the `import '@stripe/stripe-js';` statement. To best leverage Stripe’s advanced fraud functionality, ensure that Stripe.js is loaded on every page of your customer's checkout journey, not just your checkout page. This allows Stripe to detect anomalous behavior that may be indicative of fraud as customers browse your website.

To make sure Stripe.js is loaded on all relevant pages, we create a [Layout component](https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript/components/Layout.tsx) that loads and initialises Stripe.js and wraps our pages in an Elements provider so that it is available everywhere we need it:

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

If you operate a pure static site (did someone say [JAMstack](https://jamstack.org/)?!), you can utilise Stripe's [client-only Checkout](https://stripe.com/docs/payments/checkout/client-only) functionality. In this we create our product or subscription plan details in Stripe, so that Stripe can perform the server-side validation for us. You can see some examples of this using Gatsby on my [GitHub](https://github.com/thorsten-stripe/ecommerce-gatsby-tutorial).

Back to the topic at hand: in this example, we want to allow customers to specify a custom amount that they want to donate, however we want to set some limits, which we specify in [`/config/index.ts`](https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript/config/index.ts):

```ts
export const CURRENCY = 'usd';
// Set your amount limits: Use float for decimal currencies and
// Integer for zero-decimal currencies: https://stripe.com/docs/currencies#zero-decimal.
export const MIN_AMOUNT = 10.0;
export const MAX_AMOUNT = 5000.0;
export const AMOUNT_STEP = 5.0;
```

With Next.js we can conveniently use the same config file for both our client-side and our server-side (API route) components. On the client we create a custom amount input field component which is defined in [`/components/CustomDonationInput.tsx`](https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript/components/CustomDonationInput.tsx) and can be used like this:

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

In our [server-side component](https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript/pages/api/checkout_sessions/index.ts#L18-L22), we then validate the amount that was posted from the client:

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

In JavaScript we can use the [`Intl.Numberformat` constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat) to correctly format amounts and currency symbols, as well as detect zero-Decimal currencies using the [`formatToParts` method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat/formatToParts). For this we create some helper methods in [`./utils/stripe-helpers.ts`](https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript/utils/stripe-helpers.ts):

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

As part of the [react-stripe-js](https://github.com/stripe/react-stripe-js) library, Stripe provides hooks (e.g. [`useStripe`](https://stripe.com/docs/stripe-js/react#usestripe-hook), [`useElements`](https://stripe.com/docs/stripe-js/react#useelements-hook)) to retrieve references to the stripe and elements instances.

If you're unfamiliar with the concept of Hooks in React, I recommend briefly glancing at ["Hooks at a Glance"](https://reactjs.org/docs/hooks-overview.html).

### Creating a CheckoutSession and redirecting to Stripe Checkout

[Stripe Checkout](https://stripe.com/checkout) is the fastest way to get started with Stripe and provides a stripe-hosted checkout page that comes with various payment methods and support for Apple Pay and Google Pay out of the box.

In our [`checkout_session` API route](https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript/pages/api/checkout_sessions/index.ts#L23-L40) we create a CheckoutSession with the custom donation amount:

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

In our [client-side component](https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript/components/CheckoutForm.tsx#L23-L44), we then use the CheckoutSession id to redirect to the Stripe hosted page:

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

Once the customer has completed (or canceled) the payment on the Stripe side, they will be redirected to our [`/pages/result.tsx`](https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript/pages/result.tsx) page. Here we use the `useRouter` hook to access the CheckoutSession id, that was appended to our URL, to retrieve and print the CheckoutSession object.

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

[Stripe Elements](https://stripe.com/payments/elements) are a set of prebuilt UI components that allow for maximum customisation and control of your checkout flows. You can find a collection of examples for inspiration on [GitHub](https://stripe.github.io/elements-examples).

[React Stripe.js](https://stripe.com/docs/stripe-js/react) is a thin wrapper around Stripe Elements. It allows us to add Elements to our React application.

[Above](#stripejs-loading-utility-for-esnext-applications) when setting up our Layout component, we've seen how to load Stripe and wrap our application in the Elements provider, allowing us to use the Stripe Elements components in any pages that use this Layout.

In this example we're using the [default PaymentIntents integration](https://stripe.com/docs/payments/accept-a-payment#web), which will confirm our payment client-side. Therefore, once the user submits the form, we will first need to create a PaymentIntent in our API route:

```tsx
// Partial of ./components/ElementsForm.tsx
// ...
const handleSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
    e.preventDefault();
    setPayment({ status: 'processing' });

    // Create a PaymentIntent with the specified amount.
    const response = await fetchPostJSON('/api/payment_intents', {
      amount: input.customDonation
    });
    setPayment(response);
// ...
```

```ts
// Partial of ./pages/api/payment_intents/index.ts
// ...
// Validate the amount that was passed from the client.
if (!(amount >= MIN_AMOUNT && amount <= MAX_AMOUNT)) {
  throw new Error('Invalid amount.');
}
// Create PaymentIntent from body params.
const params: Stripe.PaymentIntentCreateParams = {
  payment_method_types: ['card'],
  amount: formatAmountForStripe(amount, CURRENCY),
  currency: CURRENCY
};
const payment_intent: Stripe.PaymentIntent = await stripe.paymentIntents.create(
  params
);
// ...
```

The PaymentIntent will provide a [`client_secret`](https://stripe.com/docs/api/payment_intents/object#payment_intent_object-client_secret) which we can use to finalise the payment on the client using Stripe.js. This allows Stripe to automatically handle additional payment activation requirements like [authentication with 3D Secure](https://stripe.com/docs/payments/3d-secure), which is crucial for accepting payments in regions like Europe and India.

```tsx
// Partial of ./components/ElementsForm.tsx
// ...
 // Get a reference to a mounted CardElement. Elements knows how
    // to find your CardElement because there can only ever be one of
    // each type of element.
    const cardElement = elements!.getElement(CardElement);

    // Use the card Element to confirm the Payment.
    const { error, paymentIntent } = await stripe!.confirmCardPayment(
      response.client_secret,
      {
        payment_method: {
          card: cardElement!,
          billing_details: { name: input.cardholderName }
        }
      }
    );

    if (error) {
      setPayment({ status: 'error' });
      setErrorMessage(error.message ?? 'An unknown error occured');
    } else if (paymentIntent) {
      setPayment(paymentIntent);
    }
  };
// ...
```

**_NOTE_** that confirming the payment client-side means that we will need to [handle post-payment events](https://stripe.com/docs/payments/accept-a-payment#web-fulfillment). In this example we'll be [implementing a webhook handler](#handling-webhooks--verifying-their-signature) in the next step.

### Handling Webhooks & checking their signatures

Webhook events allow us to automatically get notified about events that happen on our Stripe account. This is especially useful when utilising [asynchronous payments](https://stripe.com/docs/payments/payment-intents/verifying-status#webhooks), subscriptions with [Stripe Billing](https://stripe.com/docs/billing/webhooks), or building a marketplace with [Stripe Connect](https://stripe.com/docs/connect/webhooks).

By default Next.js API routes are same-origin only. To allow Stripe webhook event requests to reach our API route, we need to add `micro-cors`:

```ts
// Partial of ./pages/api/webhooks/index.ts
import Cors from 'micro-cors';

const cors = Cors({
  allowMethods: ['POST', 'HEAD']
});
// ...
export default cors(webhookHandler as any);
```

This, however, means that now anyone can post requests to our API route. To make sure that a webhook event was sent by Stripe, not by a malicious third party, we need to [verify the webhook event signature](https://stripe.com/docs/webhooks/signatures#verify-official-libraries):

```ts
// Partial of ./pages/api/webhooks/index.ts
// ...
const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET!

// Stripe requires the raw body to construct the event.
export const config = {
  api: {
    bodyParser: false,
  },
}

const webhookHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const buf = await buffer(req)
    const sig = req.headers['stripe-signature']!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret)
    } catch (err) {
      // On error, log and return the error message
      console.log(`❌ Error message: ${err.message}`)
      res.status(400).send(`Webhook Error: ${err.message}`)
      return
    }

    // Successfully constructed event
    console.log('✅ Success:', event.id)
// ...
```

This way our API route is able to receive POST requests from Stripe but also makes sure, only requests sent by Stripe are actually processed.

### Deploy it to the cloud with Zeit Now

The example's [README file](https://github.com/zeit/next.js/tree/canary/examples/with-stripe-typescript#deploy-it-to-the-cloud-with-zeit-now) has detailed instructions on how to deploy it.
