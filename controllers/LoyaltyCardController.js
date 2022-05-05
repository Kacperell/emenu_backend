const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { Restaurant } = require("../models/Restaurant");

exports.getLoyaltyCardInfoToAdminPanel = async (req, res) => {
  const restaurant = await Restaurant.findOne(
    {
      uid: req.user,
    },
    {
      _id: 1,
      created: 1,
      loyaltyCardCode: 1,
      loyaltyCardMode: 1,
      loyaltyCardMessage: 1,
      loyaltyCardIcon: 1,
    }
  );
  const isoDate = new Date(restaurant.created);
  const timestamp = isoDate.getTime();
  const loyaltyCardInfo = {
    id: restaurant._id,
    loyaltyCardCode: restaurant.loyaltyCardCode,
    loyaltyCardMode: restaurant.loyaltyCardMode,
    loyaltyCardMessage: restaurant.loyaltyCardMessage,
    loyaltyCardIcon: restaurant.loyaltyCardIcon,
    timestamp: timestamp,
  };

  res.json(loyaltyCardInfo);
};

exports.changeLoyaltyCardMode = async (req, res) => {
  const dataToUpadate = {
    loyaltyCardMode: req.body.loyaltyCardMode,
  };

  const resturant = await Restaurant.updateOne(
    {
      uid: req.user,
    },
    dataToUpadate,
    {
      new: true,
    }
  ); //.exec();
  res.json(req.body.loyaltyCardMode);
};

exports.logInToScanner = async (req, res) => {
  const restaurant = await Restaurant.findOne(
    {
      _id: req.body.id,
    },
    {
      _id: 1,
      name: 1,
      created: 1,
      loyaltyCardCode: 1,
    }
  );
  const isoDate = new Date(restaurant.created);
  const timestamp = isoDate.getTime();

  if (
    timestamp != req.body.time ||
    req.body.inputKey != restaurant.loyaltyCardCode
  ) {
    res.status(404).json({
      status: "error",
      message: "Bad credentials",
    });
  } else {
    const data = {
      code: restaurant.loyaltyCardCode,
      name: restaurant.name,
    };
    res.json(data);
  }
};

const countUserVists = async (restaurantId, userId) => {
  const loyaltyCardUsersArrayFromThisUser = await Restaurant.findOne(
    {
      _id: restaurantId,
      "loyaltyCardUsersArray._id": userId,
    },
    {
      _id: 0,
      "loyaltyCardUsersArray.$": 1,
    }
  );

  if (loyaltyCardUsersArrayFromThisUser == null) {
    return 0;
  }

  const howManyUserIdInDb =
    loyaltyCardUsersArrayFromThisUser.loyaltyCardUsersArray[0].numberOfVisits;
  if (!howManyUserIdInDb) {
    return 0;
  }

  return howManyUserIdInDb;
};

exports.loyaltyCardUserScannedAddToArray = async (req, res) => {
  const intTime = parseInt(req.body.time);
  const dateFromTimeStamp = new Date(intTime);

  const userId = req.body.textScannedUserId;
  const restaurantID = req.body.id;

  const updateSucces = await Restaurant.findOneAndUpdate(
    {
      _id: restaurantID,
      created: dateFromTimeStamp,
      "loyaltyCardUsersArray._id": userId,
    },
    {
      $inc: {
        "loyaltyCardUsersArray.$.numberOfVisits": 1,
      },
    }
  );

  if (updateSucces == null) {
    await Restaurant.findOneAndUpdate(
      { _id: restaurantID, created: dateFromTimeStamp },
      {
        $push: {
          loyaltyCardUsersArray: {
            _id: userId,
            numberOfVisits: 1,
          },
        },
      }
    );
  }

  const userVisits = await countUserVists(req.body.id, userId);
  const data = {
    userVisits,
  };
  res.json(data);
};

exports.infoHowManyTimesUserWasInRestaurantFromDbPublic = async (req, res) => {
  const idRestaurant = req.body.idRestaurant;
  const idUser = req.body.idUser;
  const userVisits = await countUserVists(idRestaurant, idUser);
  res.json({ userVisits });
};

exports.updateLoyaltyCardMessageAndIcon = async (req, res) => {
  const dataToUpadate = {
    loyaltyCardMessage: req.body.loyaltyCardMessage,
    loyaltyCardIcon: req.body.loyaltyCardIcon,
  };
  const resturant = await Restaurant.findOneAndUpdate(
    {
      uid: req.user,
    },
    dataToUpadate,
    {
      new: true,
    }
  );
  res.json("ok");
};
