const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DishSchema = new mongoose.Schema({
  name: String,
  price: String,
  description: {
    type: String,
  },
  photo: {
    type: String,
  },
  order: {
    type: Number,
    require: true,
  },
});
const MenuSchema = new mongoose.Schema({
  name: String,
  dishes: [DishSchema],
  order: {
    type: Number,
    require: true,
  },
});
const ReviewSchema = new mongoose.Schema({
  ratingFood: {
    type: Number,
    min: 1,
    max: 5,
  },
  ratingService: {
    type: Number,
    min: 1,
    max: 5,
  },
  text: {
    type: String,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

const UsersLoyaltyCard = new mongoose.Schema({
  _id: {
    type: String,
  },
  numberOfVisits: {
    type: Number,
    default: 0,
  },
});

const RestauratnSchema = new Schema({
  name: {
    type: String,
    trim: true,
  },
  logo: {
    type: String,
    trim: true,
  },
  uid: {
    type: String,
    trim: true,
    unique: true,
    require: true,
  },
  menu: [MenuSchema],
  reviewsMode: {
    type: Boolean,
    default: true,
  },
  reviews: [ReviewSchema],
  loyaltyCardCode: {
    type: Number,
  },

  loyaltyCardUsersArray: [UsersLoyaltyCard],

  loyaltyCardMode: {
    type: Boolean,
    default: true,
  },
  loyaltyCardIcon: {
    type: String,
    default: "favorite",
  },
  loyaltyCardMessage: {
    type: String,
    trim: true,
  },
  buymeacoffeeID: {
    type: String,
    trim: true,
  },
  fb: {
    type: String,
    trim: true,
  },
  instagram: {
    type: String,
    trim: true,
  },
  stripeSessionID: {
    type: String,
    trim: true,
  },
  stripeCustomerID: {
    type: String,
    trim: true,
  },
  stripeSubscriptionID: {
    type: String,
    trim: true,
  },
  stripeCurrentPeriodEnd: {
    type: Number,
    trim: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

RestauratnSchema.index({
  uid: 1,
});

RestauratnSchema.index({
  loyaltyCardUsersArray: 1,
});
RestauratnSchema.index({
  "loyaltyCardUsersArray.$": 1,
});
RestauratnSchema.index({
  _id: 1,
  loyaltyCardUsersArray: 1,
});

module.exports.Restaurant = Restaurant = mongoose.model(
  "restaurant",
  RestauratnSchema
);
