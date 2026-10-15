const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { validateRequired } = require("../middleware/validator");
const { optionalAuth } = require("../middleware/auth");

router.use(optionalAuth);

// GET /api/users
router.get("/", userController.getUsers);

// GET /api/users/:id
router.get("/:id", userController.getUserById);

// POST /api/users
router.post(
    "/",
    validateRequired(["name", "email"]),
    userController.createUser
);

module.exports = router;
