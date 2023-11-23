const router = require("express").Router();
const jwt = require("jsonwebtoken");

const User = require("../models").user;

const registerValidation = require("../validation").registerValidation;
const loginValidation = require("../validation").loginValidation;

// Middlewares
router.use((req, res, next) => {
  console.log("Request from auth route...");
  next();
});

router.get("/testAPI", (req, res) => {
  return res.send("auth route connected successfully...");
});

router.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;

  // Confirm user input datas are valid for userSchema.
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Confirm user email has already registered or not.
  const existEmail = await User.findOne({ email });
  if (existEmail)
    return res
      .status(400)
      .send(
        "Email already registered. Please use a different email or log in with the existing one."
      );

  // Let User register as a newUser
  const newUser = new User({ username, email, password, role });
  try {
    const savedUser = await newUser.save();
    return res.send({
      message: "User Saved Successfully",
      savedUser,
    });
  } catch (e) {
    return res.status(500).send("Can not Save User...");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Confirm user input datas are valid for userSchema.
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Confirm user email has already registered or not.
  const foundUser = await User.findOne({ email });
  if (!foundUser) {
    return res
      .status(401)
      .send(
        "Login failed. User not found. Verify your credentials or sign up for an account."
      );
  }

  foundUser.comparePassword(password, (err, isMatch) => {
    if (err) return res.status(500).send(err);
    if (isMatch) {
      // Create JSON WEB TOKEN (JWT)
      const tokenObject = { _id: foundUser._id, email: foundUser.email };
      const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
      return res.send({
        message: "Login successful. Welcome back!",
        token: `JWT ${token}`,
        user: foundUser,
      });
    } else {
      return res
        .status(401)
        .send(
          "Login failed. Incorrect password. Please double-check and try again."
        );
    }
  });
});

module.exports = router;
