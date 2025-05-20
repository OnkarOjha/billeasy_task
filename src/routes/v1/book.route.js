const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth");
const bookController = require("../../controllers/book.controller");

router.post("/", auth(), bookController.createBook);
router.get("/", bookController.getAllBooks);
router.get("/:id", bookController.getBookById);
router.post("/:id/reviews", auth(), bookController.addReview);

module.exports = router;
