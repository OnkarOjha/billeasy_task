const express = require("express");
const authRoute = require("./auth.route");
const userRoute = require("./user.route");
const bookRoute = require("./book.route");

const searchRoute = require("./search.route");
const reviewRoute = require("./review.route");

const config = require("../../config/config");

const router = express.Router();

const defaultRoutes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/users",
    route: userRoute,
  },
  {
    path: "/book",
    route: bookRoute,
  },
  {
    path: "/search",
    route: searchRoute,
  },
  {
    path: "/review",
    route: reviewRoute,
  },
];

router.get("/", (req, res) => {
  res.send("Hello Billeasy We are up and Running!!");
});

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === "development") {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
