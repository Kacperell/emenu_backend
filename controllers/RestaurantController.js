// const mongoose = require('mongoose');
const { Restaurant } = require("../models/Restaurant");

exports.create = async (req, res) => {
  Date.prototype.addDays = function (days) {
    let date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  };

  const todayDate = new Date();
  let endDate = todayDate.addDays(15);
  const endTrialDate = endDate.getTime();

  const newResturant = new Restaurant({
    uid: req.user,
    loyaltyCardCode: Math.floor(Math.random() * 10000000) + 999999,
    menu: [],
    stripeCurrentPeriodEnd: endTrialDate,
  });
  const restaurant = await newResturant.save();
  res.json("ok");
};

exports.updateRestaurantInfo = async (req, res) => {
  const dataToUpadate = {
    name: req.body.name,
    fb: req.body.fb,
    instagram: req.body.instagram,
    buymeacoffeeID: req.body.buymeacoffeeID,
  };
  const resturant = await Restaurant.findOneAndUpdate(
    {
      uid: req.user,
    },
    dataToUpadate,
    {
      new: true,
    }
  ); //.exec();
  res.json("ok");
};

exports.updateRestauranLogo = async (req, res) => {
  const dataToUpadate = {
    logo: req.body.logoUrl,
  };
  const resturant = await Restaurant.findOneAndUpdate(
    {
      uid: req.user,
    },
    dataToUpadate,
    {
      new: true,
    }
  ); //.exec();
  res.json("ok");
};

exports.restaurantInfo = async (req, res) => {
  const restaurant = await Restaurant.findOne(
    {
      uid: req.user,
    },
    {
      _id: 1,
      name: 1,
      logo: 1,
      fb: 1,
      instagram: 1,
      buymeacoffeeID: 1,
      stripeCurrentPeriodEnd: 1,
      created: 1,
    }
  );
  res.json(restaurant);
};

exports.getReviews = async (req, res) => {
  const restaurant = await Restaurant.findOne(
    {
      uid: req.user,
    },
    { reviews: 1, reviewsMode: 1 }
  );
  //wyciganc tu tylko opinie!
  const howManyRecentOpinions = 10000;
  const reviews = restaurant.reviews.slice(
    Math.max(restaurant.reviews.length - howManyRecentOpinions, 0)
  );

  const reviewsAndReviewsMode = {
    reviews: reviews,
    reviewsMode: restaurant.reviewsMode,
  };

  res.json(reviewsAndReviewsMode);
};

exports.getPublicRestaurantInfo = async (req, res) => {
  const restaurant = await Restaurant.findOne(
    { _id: req.params.id },
    {
      name: 1,
      menu: 1,
      logo: 1,
      fb: 1,
      instagram: 1,
      reviewsMode: 1,
      loyaltyCardMode: 1,
      loyaltyCardMessage: 1,
      loyaltyCardIcon: 1,
      buymeacoffeeID: 1,
      created: 1,
      stripeCurrentPeriodEnd: 1,
    } //tylko te warosci bierzemy
  );

  res.json(restaurant);
};

exports.addReview = async (req, res) => {
  const restaurantId = req.body.id;
  const valueFood = req.body.valueFood;
  const valueService = req.body.valueService;
  const textReview = req.body.textReview;
  await Restaurant.findOneAndUpdate(
    { _id: restaurantId },
    {
      $push: {
        reviews: {
          ratingFood: valueFood,
          ratingService: valueService,
          text: textReview,
        },
      },
    }
  );
  res.json("Review added");
};

exports.changeReviewMode = async (req, res) => {
  const dataToUpadate = {
    reviewsMode: req.body.reviewsMode,
  };
  const resturant = await Restaurant.findOneAndUpdate(
    {
      uid: req.user,
    },
    dataToUpadate,
    {
      new: true,
    }
  ); //.exec();
  res.json(req.body.reviewsMode);
};
