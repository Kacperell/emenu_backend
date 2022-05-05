const express = require("express");
const router = express.Router();

const RestaurantController = require("../controllers/RestaurantController");
const LoyaltyCardController = require("../controllers/LoyaltyCardController");
const MenuController = require("../controllers/MenuController");
const StripeController = require("../controllers/StripeController");
const rateLimit = require("express-rate-limit");

const admin = require("firebase-admin");

const { catchErrors } = require("../handlers/errorHandlers");

const auth = require("../handlers/authCheck");

router.get("/articles", async (req, res) => {
  console.log("fsa");
  return res.send("Zalogowny");
});

var serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://emenu-6b11d.firebaseio.com",
});

router.get("/", async (req, res) => {
  const myDynamicManifest = {
    name: "Przykładowa RestauracjaB",
    short_name: "Przykładowa Restauracjabe",
    display: "standalone",
    description: "Resturant app",
    start_url:
      "https://emenu-6b11d.web.app/restaurant/5f7a351145d28c0c4005cb85",
    background_color: "#ffffff",
    theme_color: "#f50057",
    icons: [
      {
        src: "https://firebasestorage.googleapis.com/v0/b/emenu-6b11d.appspot.com/o/AG88H1J04vTLtbLKAQIP28rKGUB2%2FrestaurantLogo%2F5f7a351145d28c0c4005cb85_512x512?alt=media",
        sizes: "512x512",
        purpose: "any maskable",
        type: "image/png",
      },
    ],
  };
  res.json(myDynamicManifest);
});

router.post("/ver", async (req, res) => {
  let idToken = req.body.token;
  admin
    .auth()
    .verifyIdToken(idToken)
    .then(function (decodedToken) {
      let uid = decodedToken.uid;
      // ...
      console.log("yes");
      return res.send(uid);
    })
    .catch(function (error) {
      console.log("error");
      return res.send("errr");
    });
});

//on start when use make accout in firebase
router.post("/create", auth, catchErrors(RestaurantController.create));
router.get(
  "/restaurantinfo",
  auth,
  catchErrors(RestaurantController.restaurantInfo)
);

router.get("/getReviews", auth, catchErrors(RestaurantController.getReviews));

router.post(
  "/updateRestaurantInfo",
  auth,
  catchErrors(RestaurantController.updateRestaurantInfo)
);
router.post(
  "/updateRestauranLogo",
  auth,
  catchErrors(RestaurantController.updateRestauranLogo)
);
router.post(
  "/add-categoryMenu",
  auth,
  catchErrors(MenuController.addCategoryMenu)
);
router.post(
  "/edit-categoryMenu",
  auth,
  catchErrors(MenuController.editCategoryMenu)
);
router.post(
  "/changeOrder-categoryMenu",
  auth,
  catchErrors(MenuController.changeOrderCategoryMenu)
);
router.post(
  "/delete-categoryMenu",
  auth,
  catchErrors(MenuController.deleteCategoryMenu)
);
router.get(
  "/listOfCategoriesMenu",
  auth,
  catchErrors(MenuController.listOfCategoriesMenu)
);

router.get(
  "/listOfDishesFromOneCategory/:id",
  auth,
  catchErrors(MenuController.listOfDishesFromOneCategory)
);
router.post("/addDishToMenu", auth, catchErrors(MenuController.addDishToMenu));
router.post(
  "/editDishInMenu",
  auth,
  catchErrors(MenuController.editDishInMenu)
);
router.post(
  "/changeOrder-dishes",
  auth,
  catchErrors(MenuController.changeOrderDishes)
);
router.post("/deleteDish", auth, catchErrors(MenuController.deleteDish));
router.post(
  "/changeReviewMode",
  auth,
  catchErrors(RestaurantController.changeReviewMode)
);

// Admin panel layoulty card
//to make url and send code
router.get(
  "/getLoyaltyCardInfoToAdminPanel",
  auth,
  catchErrors(LoyaltyCardController.getLoyaltyCardInfoToAdminPanel)
);

router.post(
  "/changeLoyaltyCardMode",
  auth,
  catchErrors(LoyaltyCardController.changeLoyaltyCardMode)
);

const apiLimiterLogIn = rateLimit({
  windowMs: 15000, //10 tries per 10 seconds
  max: 6,
});
router.post(
  "/logInToScanner",
  apiLimiterLogIn,
  catchErrors(LoyaltyCardController.logInToScanner)
);
router.post(
  "/loyaltyCardUserScannedAddToArray",
  catchErrors(LoyaltyCardController.loyaltyCardUserScannedAddToArray)
);

router.post(
  "/updateLoyaltyCardMessageAndIcon",
  auth,
  catchErrors(LoyaltyCardController.updateLoyaltyCardMessageAndIcon)
);
router.post(
  "/infoHowManyTimesUserWasInRestaurantFromDbPublic",
  catchErrors(
    LoyaltyCardController.infoHowManyTimesUserWasInRestaurantFromDbPublic
  )
);

//STRIPE
router.post(
  "/create-checkout-session",
  auth,
  catchErrors(StripeController.createCheckoutSession)
);
//STRIPE
router.get(
  "/checkout-session/:session_id",
  // auth,
  catchErrors(StripeController.getCheckoutSession)
);
//STRIPE
router.get(
  "/get-subscription-info",
  auth,
  catchErrors(StripeController.getSubscriptionInfo)
);
router.post(
  "/customer-portal",
  auth,
  catchErrors(StripeController.costumerPoral)
);

router.post("/webhook", StripeController.webhook);

//public local
router.get(
  "/getPublicRestaurantInfo/:id",
  catchErrors(RestaurantController.getPublicRestaurantInfo)
);
router.post("/addReview", catchErrors(RestaurantController.addReview));

module.exports = router;

// D:\programy\ngrok-stable-windows-amd64
// ngrok.exe http 8080
