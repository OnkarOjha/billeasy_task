const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const bookService = require("../services/book.service");
const ApiError = require("../utils/ApiError");

/**
 * POST /books
 * Create a new book
 */
const createBook = async (req, res, next) => {
  try {
    const book = await bookService.createBook(req.body);
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
};
/**
 * GET /books
 * Get paginated list of books or search by keyword query param
 */
const getAllBooks = catchAsync(async (req, res) => {
  const { page, limit, author, genre, keyword } = req.query;

  if (keyword) {
    const books = await bookService.searchBooks(keyword);
    return res.send(books);
  }

  const result = await bookService.getBooks({
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
    author,
    genre,
  });
  res.send(result);
});

/**
 * GET /books/:id
 * Get book details with average rating and paginated reviews
 */
const getBookById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page, limit } = req.query;
  const result = await bookService.getBookById(id, {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 5,
  });
  res.send(result);
});

/**
 * POST /books/:id/reviews
 * Add a review to a book (one review per user)
 */
const addReview = catchAsync(async (req, res) => {
  const bookId = req.params.id;
  const userId = req.userId;

  const { rating, comment } = req.body;
  const review = await bookService.addReview({
    bookId,
    userId,
    rating,
    comment,
  });
  res.status(httpStatus.CREATED).send(review);
});

/**
 * PUT /reviews/:id
 * Update a review by id (only by owner)
 */
const updateReview = catchAsync(async (req, res) => {
  const reviewId = req.params.id;
  const userId = req.userId;
  const updateBody = req.body;

  console.log(updateBody);
  const updatedReview = await bookService.updateReview(
    reviewId,
    userId,
    updateBody
  );
  res.send(updatedReview);
});

/**
 * DELETE /reviews/:id
 * Delete a review by id (only by owner)
 */
const deleteReview = async (req, res) => {
  const reviewId = req.params.id;
  const userId = req.userId;

  console.log("b:", userId);

  try {
    await bookService.deleteReview(reviewId, userId);
    res.status(httpStatus.OK).send({ message: "Review deleted successfully" });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).send({
        message: "Delete Review Failed",
        error: error.message,
      });
    }

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: "Delete Review Failed",
      error: "Internal Server Error",
    });
  }
};

/**
 * GET /books/search?keyword=somekeyword
 * Search books by title or author (partial and case-insensitive)
 */
const searchBooks = catchAsync(async (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    // You can either return all books or a 400 error here
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Keyword query parameter is required" });
  }

  const books = await bookService.searchBooks(keyword);
  res.send(books);
});

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  addReview,
  updateReview,
  deleteReview,
  searchBooks,
};
