---
path: "/blog/2019-01-08-the-birth-5"
templateKey: blog-post
title: How do Subscriptions and Application Fees work together
date: 2018-11-01T16:03:42.361Z
description: >-
  Whenever you use Stripe Connect, you can create charges on behalf of your
  connected accounts. Usually, you want to take a cut of the payment for your
  own platform which is done by using application fees.
tags:
  - Billing
  - Connect
---

Some platforms will charge customers on a recurring basis. In that case, they will create a subscription in the connected account. When doing so, they can set the `application_fee_percent` parameter to tell us what percentage of each invoice they plan to get on each billing cycle.

The reason we default to a percentage value instead of a fixed fee is that with subscriptions you don't always know in advance how much you will charge the customer. For example, some platforms will add invoice items to the invoice when it's created to take into account extra fees for that month. In other cases, the invoice will include proration invoice items created when the customer moved to a new plan. Because the amount can change, we expect that most platforms will want a percentage of the invoice instead of a fixed fee.

Some platforms don't like the percentage solution though. In most cases, they have their own fixed pricing and the percentage prevents them from taking their exact fee due to rounding errors. In that case, there's an alternative. You can update an invoice and pass the `application_fee` parameter to set the exact application fee that you want in cents. You would do this by using Webhooks and listening for `invoice.created` events. This would tell you that a new invoice was created and you could set your application fee which would override the default `application_fee_percent` set on the subscription itself. There is one caveat though! The first invoice of a subscription is always closed automatically and paid immediately. The platform still needs to take this into account and calculate the percentage they should set to get the right application fee on the first invoice which is a bit painful.

_Fun fact: If a platform created a subscription with an application fee and the connected account tries to trick them and disconnect the platform, the subscription stays active and the platform still gets their application fee!_
