const mongoose = require("mongoose");
const { Restaurant } = require("../models/Restaurant");

exports.listOfCategoriesMenu = async (req, res) => {
  const restaurant = await Restaurant.findOne(
    {
      uid: req.user,
    },
    { menu: 1 }
  );

  res.json(restaurant.menu);
};

const countOfMenuCategories = async (req) => {
  const count = await Restaurant.aggregate([
    {
      $match: {
        uid: req.user,
      },
    },
    {
      $project: {
        arraySize: { $size: "$menu" },
        _id: 0,
      },
    },
  ]);
  const lenghtMenuArray = count[0].arraySize;
  return lenghtMenuArray;
};

exports.addCategoryMenu = async (req, res) => {
  const lenghtMenuArray = await countOfMenuCategories(req);
  const resturant = await Restaurant.updateOne(
    { uid: req.user },
    {
      $push: {
        menu: {
          name: req.body.nameNewCategory,
          dishes: [],
          order: lenghtMenuArray,
        },
      },
    }
  );

  res.json(lenghtMenuArray);
};
exports.editCategoryMenu = async (req, res) => {
  const lenghtMenuArray = await countOfMenuCategories(req);
  const orderCategory = parseInt(req.body.idEditCategory);
  const newName = req.body.nameNewCategory;
  await Restaurant.updateOne(
    { uid: req.user, "menu.order": orderCategory },
    { $set: { "menu.$.name": newName } },
    function (err, doc) {
      // console.log(err)
      // console.log(doc)
    }
  );
  res.json(true);
};

exports.deleteCategoryMenu = async (req, res) => {
  let lenghtMenuArray = await countOfMenuCategories(req);

  //we dalate all photos from firbase
  await Restaurant.updateOne(
    { uid: req.user },
    { $pull: { menu: { order: req.body.order } } }
  );

  //each element with order > order of deleted element -1
  for (let i = req.body.order; i < lenghtMenuArray; i++) {
    if (req.body.order != i && i != 0) {
      await Restaurant.updateOne(
        { uid: req.user, "menu.order": i },
        { $set: { "menu.$.order": i - 1 } }
        // function (err, doc) {
        //     console.log(err)
        //     console.log(doc)
        // }
      );
    }
  }

  res.json("deletigon");
};
exports.changeOrderCategoryMenu = async (req, res) => {
  // 0 left <-
  //  1 rigt ->
  let categoryId = req.body.categoryId;
  let kierunek = parseInt(req.body.kierunek);
  let order = parseInt(req.body.order);
  const lenghtMenuArray = await countOfMenuCategories(req);
  if (order == 0 && kierunek == 0) {
    //first element in left not should be
    return;
  }
  if (order == lenghtMenuArray && kierunek == 1) {
    //last element in right not should be
    return;
  }

  let mainElementorderToChange;
  const secondElementorderToChange = order;
  if (kierunek == 0) {
    mainElementorderToChange = order - 1;
  } else {
    mainElementorderToChange = order + 1;
  }
  await Restaurant.updateOne(
    { uid: req.user, "menu.order": mainElementorderToChange },
    { $set: { "menu.$.order": order } },
    function (err, doc) {
      // console.log(err)
      // console.log(doc)
    }
  );
  await Restaurant.updateOne(
    { uid: req.user, "menu._id": categoryId },
    { $set: { "menu.$.order": mainElementorderToChange } },
    function (err, doc) {
      // console.log(err)
      // console.log(doc)
    }
  );

  res.json("order");
};

//dishes

const countOfDishesOneMenuCategories = async (req, menuId) => {
  const menus = await Restaurant.aggregate([
    {
      $match: {
        uid: req.user,
      },
    },
    {
      $unwind: "$menu",
    },

    {
      $project: {
        "menu._id": 1,
        arraySize: { $size: "$menu.dishes" },
      },
    },
  ]);

  let lenghtDishesArray = 0;
  for (const menu of menus) {
    if (menu.menu._id == menuId) {
      lenghtDishesArray = menu.arraySize;
      break;
    }
  }
  return lenghtDishesArray;
};

exports.listOfDishesFromOneCategory = async (req, res) => {
  const menuId = req.params.id;
  const dishes = await Restaurant.findOne(
    {
      uid: req.user,
    },
    { menu: { $elemMatch: { _id: menuId } } }
  );

  // console.log('dishes', dishes);
  res.json(dishes);
  // res.json('restaurant.menu');
};
exports.addDishToMenu = async (req, res) => {
  const menuId = req.body.menuId;
  const dishInfo = req.body.dishInfo;

  const lenghtDishesArray = await countOfDishesOneMenuCategories(req, menuId);
  await Restaurant.updateOne(
    { uid: req.user, "menu._id": menuId },
    {
      $addToSet: {
        "menu.$.dishes": {
          name: dishInfo.name,
          description: dishInfo.description,
          price: dishInfo.price,
          photo: dishInfo.photo,
          order: lenghtDishesArray,
        },
      },
    },
    function (err, doc) {
      // console.log(err)
      // console.log(doc)
    }
  );
  res.json("addDishToMenu");
};
exports.editDishInMenu = async (req, res) => {
  const menuId = req.body.menuId;
  const orderDishToEdit = req.body.idDishToEdit;
  const dishInfo = req.body.dishInfo;
  await Restaurant.updateOne(
    {
      uid: req.user,
      "menu._id": menuId,
    },
    {
      $set: {
        "menu.$[menuFilter].dishes.$[dishFileter].name": dishInfo.name,
        "menu.$[menuFilter].dishes.$[dishFileter].description":
          dishInfo.description,
        "menu.$[menuFilter].dishes.$[dishFileter].photo": dishInfo.photo,
        "menu.$[menuFilter].dishes.$[dishFileter].price": dishInfo.price,
      },
    },
    {
      multi: true,
      arrayFilters: [
        { "menuFilter._id": { $eq: menuId } },
        { "dishFileter.order": { $eq: orderDishToEdit } },
      ],
    }
  );
  res.json("addDishToMenu");
};

exports.deleteDish = async (req, res) => {
  const menuId = req.body.menuId;
  const order = req.body.order;
  const lenghtDishesArray = await countOfDishesOneMenuCategories(req, menuId);

  await Restaurant.updateOne(
    { uid: req.user, "menu._id": menuId },
    { $pull: { "menu.$.dishes": { order: order } } }
  );

  //each element with order > order of deleted element -1
  for (let i = order; i < lenghtDishesArray; i++) {
    if (order != i && i != 0) {
      await Restaurant.updateOne(
        {
          uid: req.user,
          "menu._id": menuId,
        },
        { $set: { "menu.$[menuFilter].dishes.$[dishFileter].order": i - 1 } },
        {
          multi: true,
          arrayFilters: [
            { "menuFilter._id": { $eq: menuId } },
            { "dishFileter.order": { $eq: i } },
          ],
        }
      );
    }
  }

  res.json("delete dDishToMenu");
};

exports.changeOrderDishes = async (req, res) => {
  // 0 up
  //  1 down
  let dishId = req.body.dishId;
  let kierunek = parseInt(req.body.kierunek);
  let menuId = req.body.menuId;
  let order = parseInt(req.body.order);

  const lenghtMenuArray = await countOfDishesOneMenuCategories(req, menuId);
  if (order == 0 && kierunek == 0) {
    //first element in right not should be
    return;
  }
  if (order == lenghtMenuArray && kierunek == 1) {
    //last element in right not should be
    return;
  }

  let mainElementorderToChange;

  if (kierunek == 0) {
    mainElementorderToChange = order - 1;
  } else {
    mainElementorderToChange = order + 1;
  }

  await Restaurant.updateOne(
    {
      uid: req.user,
      "menu._id": menuId,
    },
    { $set: { "menu.$[menuFilter].dishes.$[dishFileter].order": order } },
    {
      multi: true,
      arrayFilters: [
        { "menuFilter._id": { $eq: menuId } },
        { "dishFileter.order": { $eq: mainElementorderToChange } },
      ],
    }
  );

  await Restaurant.updateOne(
    {
      uid: req.user,
      "menu._id": menuId,
    },
    {
      $set: {
        "menu.$[menuFilter].dishes.$[dishFileter].order":
          mainElementorderToChange,
      },
    },
    {
      multi: true,
      arrayFilters: [
        { "menuFilter._id": { $eq: menuId } },
        { "dishFileter._id": { $eq: dishId } },
      ],
    }
  );

  res.json("order");
};
