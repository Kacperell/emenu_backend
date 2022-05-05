const Stripe = require("stripe");
const stripe = Stripe("");
const { Restaurant } = require("../models/Restaurant");

const saveSripeSessionIdToDb = async (userID, sessionID) => {
  //after checkout
  const dataToUpadate = {
    stripeSessionID: sessionID,
  };
  const resturant = await Restaurant.updateOne(
    {
      uid: userID,
    },
    dataToUpadate,
    {
      new: true,
    }
  );
};

exports.createCheckoutSession = async (req, res) => {
  const subscriptionFromDb = await Restaurant.findOne(
    { uid: req.user },
    {
      stripeSubscriptionID: 1,
    }
  );
  if (subscriptionFromDb.stripeSubscriptionID) {
    const subscription = await stripe.subscriptions.retrieve(
      subscriptionFromDb.stripeSubscriptionID
    );
    if (subscription.status == "active") {
      res.status(400);
      return res.send({
        error: {
          message: "Masz juz subsckrypcje",
        },
      });
    }
  }

  const domainURL = process.env.DOMAIN;
  const priceId = req.body.PriceId;

  const userEmail = req.body.userEmail;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      // locale: lngFromFrontEnd,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      success_url: `${domainURL}/adminPanel/accountSettings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domainURL}/adminPanel/accountSettings`,
    });

    saveSripeSessionIdToDb(req.user, session.id);
    console.log("createCheckoutSession", priceId);
    console.log("createCheckoutSession2", req.user, session.id);

    res.send({
      sessionId: session.id,
    });
  } catch (e) {
    console.log(e);
    res.status(400);
    return res.send({
      error: {
        message: e.message,
      },
    });
  }
};

// Fetch the Checkout Session to display the JSON result on the success page
exports.getCheckoutSession = async (req, res) => {
  const sessionId = req.params.session_id;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  res.send(session);
};

const getStripeCustomerIDfromDB = async (firebaseUserId) => {
  const customer = await Restaurant.findOne(
    { uid: firebaseUserId },
    {
      stripeCustomerID: 1,
    }
  );
  return customer.stripeCustomerID;
};

exports.costumerPoral = async (req, res) => {
  const returnUrl = `${process.env.DOMAIN}/adminPanel/accountSettings`;
  const customer = await getStripeCustomerIDfromDB(req.user);

  const portalsession = await stripe.billingPortal.sessions.create({
    customer: customer,
    return_url: returnUrl,
  });
  res.send({
    url: portalsession.url,
  });
};

const setStripeCustumerAndSubscriptionIdInDB = async (
  sesssionID,
  customerID,
  subscriptionID
) => {
  const dataToUpadate = {
    stripeCustomerID: customerID,
    stripeSubscriptionID: subscriptionID,
  };
  const resturant = await Restaurant.updateOne(
    {
      stripeSessionID: sesssionID,
    },
    dataToUpadate,
    {
      new: true,
    }
  );
  return 1;
};

const updateStripeCurrentPeriodEndAfterPayment = async (
  subscriptionId,
  customerID
) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  if (subscription.customer != customerID) {
    console.log("error!!!", "inny cusotmer ID!!!");
  }

  console.log("updateStripeCurrentPeriodEndAfterPayment");
  console.log("subscription", subscription);
  console.log("current_period_end", subscription.current_period_end);
  console.log("customer", subscription.customer);

  const period_end = subscription.current_period_end + 86400;
  const dataToUpadate = {
    stripeCurrentPeriodEnd: period_end,
  };
  const resturant = await Restaurant.updateOne(
    {
      stripeCustomerID: customerID,
    },
    dataToUpadate,
    {
      new: true,
    }
  );
  return 1;
};

exports.getSubscriptionInfo = async (req, res) => {
  const subscriptionFromDb = await Restaurant.findOne(
    { uid: req.user },
    {
      stripeSubscriptionID: 1,
      created: 1,
      stripeCurrentPeriodEnd: 1,
    }
  );
  if (!subscriptionFromDb.stripeSubscriptionID) {
    const data = {
      subscriptionStatus: "no_subscription",
      created: subscriptionFromDb.created,
      stripeCurrentPeriodEnd: subscriptionFromDb.stripeCurrentPeriodEnd,
    };
    // res.json('no_subscription');
    res.json(data);
    return;
  }
  const subscription = await stripe.subscriptions.retrieve(
    subscriptionFromDb.stripeSubscriptionID
  );

  const data = {
    subscriptionStatus: subscription.status,
    created: subscriptionFromDb.created,
    stripeCurrentPeriodEnd: subscriptionFromDb.stripeCurrentPeriodEnd,
  };
  res.json(data);
};

exports.webhook = async (req, res) => {
  let eventType;
  console.log(`😎 webhook!`);

  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    const signature = req.headers["stripe-signature"];
    try {
      //cos to nie działa nie wiem czemu :(
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️ Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    data = event.data;
    eventType = event.type;
  } else {
    return;
  }

  if (eventType === "checkout.session.completed") {
    console.log(` =============checkout.session.completed==========`);
    console.log("DATAAAAAAAAAAAAAADATAAAAAAAAAAAAAA", data);
    const saveCustomer = await setStripeCustumerAndSubscriptionIdInDB(
      data.object.id,
      data.object.customer,
      data.object.subscription
    );
    if (saveCustomer) {
      res.sendStatus(200);
    } else {
      console.log("error");
      res.sendStatus(400);
    }
    console.log(`🔔  checkout.session.completed!`);
    console.log(`🔔  Payment received!`);
    return;
  } else if (eventType === "invoice.paid") {
    console.log(` =============invoice.paid==========`);

    //update  stripeCurrentPeriodEnd in this custoemr
    const update = await updateStripeCurrentPeriodEndAfterPayment(
      data.object.subscription,
      data.object.customer
    );
    if (update) {
      res.sendStatus(200);
    } else {
      console.log("error");
      res.sendStatus(400);
    }
    // console.log(data);
    console.log(`🔔  invoice.paid`);
    return;
  } else if (eventType === "invoice.payment_failed") {
    console.log(`🔔  invoice.payment_failed!`);
  }

  res.sendStatus(200);
};
