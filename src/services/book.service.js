const httpStatus = require("http-status");
const mongoose = require("mongoose");
const Book = require("../models/book.model");
const Review = require("../models/review.model");
const ApiError = require("../utils/ApiError");

/**
 * Create a new book
 * @param {Object} bookBody
 * @param {string} bookBody.title - Book title
 * @param {string} bookBody.author - Book author
 * @param {string} [bookBody.genre] - Book genre
 * @returns {Promise<Book>}
 */
const createBook = async (bookBody) => {
  return Book.create(bookBody);
};

/**
 * Get paginated list of books with optional author and genre filters
 * @param {Object} options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @param {string} [options.author]
 * @param {string} [options.genre]
 * @returns {Promise<{docs: Book[], total: number, page: number, limit: number}>}
 */
const getBooks = async ({ page = 1, limit = 10, author, genre }) => {
  const filter = {};
  if (author) filter.author = new RegExp(author, "i");
  if (genre) filter.genre = new RegExp(genre, "i");

  const skip = (page - 1) * limit;

  const [docs, total] = await Promise.all([
    Book.find(filter).skip(skip).limit(limit).exec(),
    Book.countDocuments(filter),
  ]);

  return { docs, total, page, limit };
};

/**
 * Get book by id including average rating and paginated reviews
 * @param {string} bookId
 * @param {Object} options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=5]
 * @returns {Promise<Object>} Book info with avgRating and reviews
 * @throws {ApiError} if book not found or invalid id
 */
const getBookById = async (bookId, { page = 1, limit = 5 } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid book ID");
  }

  const book = await Book.findById(bookId);
  if (!book) {
    throw new ApiError(httpStatus.NOT_FOUND, "Book not found");
  }

  const skip = (page - 1) * limit;

  const reviews = await Review.find({ book: bookId })
    .populate("user", "username")
    .skip(skip)
    .limit(limit)
    .exec();

  const agg = await Review.aggregate([
    { $match: { book: mongoose.Types.ObjectId(bookId) } },
    { $group: { _id: null, avgRating: { $avg: "$rating" } } },
  ]);

  const averageRating = agg.length ? agg[0].avgRating : 0;

  return { book, averageRating, reviews };
};

/**
 * Add a review to a book (one review per user per book)
 * @param {Object} data
 * @param {string} data.bookId
 * @param {string} data.userId
 * @param {number} data.rating
 * @param {string} [data.comment]
 * @returns {Promise<Review>}
 * @throws {ApiError} If review already exists or invalid IDs
 */
const addReview = async ({ bookId, userId, rating, comment }) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid book ID");
  }
  //   if (!mongoose.Types.ObjectId.isValid(userId)) {
  //     throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user ID");
  //   }

  const existingReview = await Review.findOne({ book: bookId, user: userId });
  if (existingReview) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User has already reviewed this book"
    );
  }

  const review = await Review.create({
    book: bookId,
    user: userId,
    rating,
    comment,
  });

  await Book.findByIdAndUpdate(bookId, { $push: { reviews: review._id } });

  return review;
};

/**
 * Search books by title or author (partial and case-insensitive)
 * @param {string} keyword
 * @returns {Promise<Book[]>}
 */
const searchBooks = async (keyword) => {
  const regex = new RegExp(keyword, "i"); // case-insensitive regex for partial match
  return Book.find({
    $or: [{ title: regex }, { author: regex }],
  });
};

/**
 * Update a review by id (only by owner)
 * @param {string} reviewId
 * @param {string} userId - ID of user trying to update the review
 * @param {Object} updateBody - { rating?, comment? }
 * @returns {Promise<Review>}
 * @throws {ApiError} if review not found, invalid ID, or unauthorized
 */
const updateReview = async (reviewId, userId, updateBody) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid review ID");
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
  }

  if (review.user.toString() !== userId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only update your own review"
    );
  }

  Object.assign(review, updateBody);
  await review.save();

  return review;
};

/**
 * Delete a review by id (only by owner)
 * @param {string} reviewId
 * @param {string} userId - ID of user trying to delete the review
 * @returns {Promise<void>}
 * @throws {ApiError} if review not found, invalid ID, or unauthorized
 */
const deleteReview = async (reviewId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid review ID");
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
  }

  if (review.user.toString() !== userId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only delete your own review"
    );
  }

  // Remove review document
  await Review.deleteOne({ _id: reviewId });

  // Remove review reference from the book
  await Book.findByIdAndUpdate(review.book, { $pull: { reviews: review._id } });
};

module.exports = {
  createBook,
  getBooks,
  getBookById,
  addReview,
  updateReview,
  deleteReview,
  searchBooks,
};
