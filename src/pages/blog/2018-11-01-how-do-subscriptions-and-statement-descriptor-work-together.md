---
path: "/blog/2019-01-08-the-birth-6"
templateKey: blog-post
title: How do subscriptions and statement descriptor work together
date: 2018-11-01T16:06:03.782Z
description: >-
  It's common for a merchant to want to control what appears on their customers'
  bank statement. With charges, they can specify this on a per-charge basis by
  passing the statement_descriptor parameter.
tags:
  - Billing
---

With subscriptions, though, the merchant does not create the charge themselves, Stripe does it for them. This means they can't directly pass the parameter. Instead, there are multiple ways to set this and we look at those in a specific order.

First off, we check if the current invoice that we're charging for has a `statement_descriptor` property set or not. This can be passed on invoice creation or, if we created it automatically, can be updated by the merchant. If there is one, we use it for the associated charge.

If there isn't, we then look at the next one which is on the plan itself. When you create a plan, you can set a custom statement descriptor that will be used on all invoices associated with that plan. When an invoice is created, if it doesn't have a custom statement descriptor we take the one from the plan. How does this work with multiple plans you ask? We take the statement descriptor associated with the first plan in the list of `items` on the subscription, if any.

If there is no custom statement descriptor on the plan either then we simply default to the one on the account for the charge associated with the invoice.

_Fun fact: Before the API version 2014-12-17, the parameter was called `statement_description` and was always appended to the default one in your account settings. This causes some confusion occasionally on some old accounts/platforms that always show their account's instead of the one they think they pass via the API._
