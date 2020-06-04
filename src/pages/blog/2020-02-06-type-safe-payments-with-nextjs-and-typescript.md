## Getting started with Next.js, TypeScript, and Stripe

- Demo: https://nextjs-typescript-react-stripe-js.now.sh/
- Code: https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript
- CodeSandbox: https://codesandbox.io/s/github/stripe-samples/nextjs-typescript-react-stripe-js

[![Video Tutorial Preview](https://img.youtube.com/vi/sPUSu19tZHg/0.jpg)](https://www.youtube.com/watch?v=sPUSu19tZHg)

## Table of Contents

- [Setting up a TypeScript project with Next.js](#setting-up-a-typescript-project-with-nextjs)
- [Managing API keys/secrets with Next.js & Vercel](#managing-api-keyssecrets-with-nextjs-&-vercel)
- [Loading Stripe.js](#loading-stripejs)
- [Creating a CheckoutSession and redirecting to Stripe Checkout](#creating-a-checkoutsession-and-redirecting-to-stripe-checkout)
- [Handling Webhooks & checking their signatures](#handling-webhooks-amp-checking-their-signatures)
- [Deploying to the cloud with Vercel](#deploy-it-to-the-cloud-with-vercel)

### Setting up a TypeScript project with Next.js

Setting up a TypeScript project with Next.js is very convenient, as it automatically generates the [`tsconfig.json`](https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript/tsconfig.json) configuration file for us. You can follow the setup steps in the [docs](https://nextjs.org/learn/excel/typescript/setup) or start off with a more complete [example](https://github.com/vercel/next.js/tree/canary/examples/with-typescript). Of course you can also find the full example that we're looking at in detail below, on [GitHub](https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript).

### Managing API keys/secrets with Next.js & Vercel

When working with API keys and secrets, you need to make sure to keep them out of version control. That's why you should set these as environment variables. Find more details on how to organise your `.env` files in the [Netx.js docs](https://nextjs.org/docs/basic-features/environment-variables).

At the root of your project add a `.env.local` file and provide the Stripe API keys from your [Stripe Dashboard](https://stripe.com/docs/development#api-keys). Make sure to add `.env*.local` to your [`.gitignore` file](https://github.com/vercel/next.js/blob/canary/examples/with-stripe-typescript/.gitignore#L13)) to tell git to not track your secrets.

```txt
# Stripe keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_12345
STRIPE_SECRET_KEY=sk_12345
```

The `NEXT_PUBLIC_` prefix automatically exposes this variable to the browser. Next.js will insert the value for these into the publicly viewable source code at build/render time. Therefore make sure to not use this prefix for secret values!

### Loading Stripe.js

Due to [PCI compliance requirements](https://stripe.com/docs/security), the Stripe.js library has to be loaded from Stripe's servers. This creates a challenge when working with server-side rendered apps, as the window object is not available on the server. To help you manage this, Stripe provides a [loading wrapper](https://github.com/stripe/stripe-js) that allows you to import Stripe.js as an ES module:

```js
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
```

Stripe.js is loaded as a side effect of the `import '@stripe/stripe-js';` statement. To best leverage Stripe’s advanced fraud functionality, ensure that Stripe.js is loaded on every page of your customer's checkout journey, not just your checkout page. This allows Stripe to detect anomalous behavior that may be indicative of fraud as customers browse your website.

If you prefer to delay loading of Stripe.js until Checkout, you can `import {loadStripe} from '@stripe/stripe-js/pure';`. Find more details on the various options in the [Stripe docs](https://stripe.com/docs/disputes/prevention/advanced-fraud-detection#disabling-advanced-fraud-detection).

### Creating a CheckoutSession and redirecting to Stripe Checkout

[Stripe Checkout](https://stripe.com/checkout) is the fastest way to get started with Stripe and provides a stripe-hosted checkout page that comes with various payment methods and support for Apple Pay and Google Pay out of the box.

In your [`checkout_session` API route](https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript/pages/api/checkout_sessions/index.ts#L23-L40) create a CheckoutSession with the custom donation amount:

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
      quantity: 1,
    },
  ],
  success_url: `${req.headers.origin}/result?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${req.headers.origin}/result?session_id={CHECKOUT_SESSION_ID}`,
};
const checkoutSession: Stripe.Checkout.Session = await stripe.checkout.sessions.create(
  params
);
// ...
```

In your [client-side component](https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript/components/CheckoutForm.tsx#L23-L44), use the CheckoutSession id to redirect to the Stripe hosted page:

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
    sessionId: checkoutSession.id,
  });
  // If `redirectToCheckout` fails due to a browser or network
  // error, display the localized error message to your customer
  // using `error.message`.
  console.warn(error.message);
};
// ...
```

### Handling Webhooks & checking their signatures

Webhook events allow you to get notified about events that happen on your Stripe account. This is especially useful for [asynchronous payments](https://stripe.com/docs/payments/payment-intents/verifying-status#webhooks), subscriptions with [Stripe Billing](https://stripe.com/docs/billing/webhooks), or building a marketplace with [Stripe Connect](https://stripe.com/docs/connect/webhooks).

By default Next.js API routes are same-origin only. To allow Stripe webhook event requests to reach your API route, add `micro-cors`:

```ts
// Partial of ./pages/api/webhooks/index.ts
import Cors from 'micro-cors';

const cors = Cors({
  allowMethods: ['POST', 'HEAD'],
});
// ...
export default cors(webhookHandler as any);
```

This, however, means that now anyone can post requests to your API route. To make sure that a webhook event was sent by Stripe, not by a malicious third party, you need to [verify the webhook event signature](https://stripe.com/docs/webhooks/signatures#verify-official-libraries):

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

This way your API route is able to receive POST requests from Stripe but also makes sure, only requests sent by Stripe are being processed.

### Deploy it to the cloud with Vercel

You can deploy this example by clicking the "Deploy to Vercel" button below. It will guide you through the secrets setup and create a fresh repository for you:

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript)

From there you can clone the repository to your local machine, and anytime you commit/push/merge changes to master, Vercel will automatically redeploy the site for you 🥳
