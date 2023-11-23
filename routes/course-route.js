const router = require("express").Router();
const mongoose = require("mongoose");

const Course = require("../models").course;

const courseValidation = require("../validation").courseValidation;

// Middlewares
router.use((req, res, next) => {
  console.log("Request from course route...");
  next();
});

// get all the courses from database
router.get("/", async (req, res) => {
  try {
    // populate is a query object in mongoose(thenable object)
    const allCourses = await Course.find({})
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(allCourses);
  } catch (e) {
    return res.status(500).send(e);
  }
});

// Find course by instructorID
router.get("/instructor/:instructorID", async (req, res) => {
  const { instructorID } = req.params;
  try {
    const coursesFound = await Course.find({ instructor: instructorID })
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(coursesFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

// find enrolled course by studentID
router.get("/student/:studentID", async (req, res) => {
  try {
    const { studentID } = req.params;
    const coursesFound = await Course.find({ students: studentID })
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(coursesFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

// find course by course title
router.get("/findByTitle/:title", async (req, res) => {
  const { title } = req.params;
  try {
    const courseFound = await Course.find({ title })
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

// find course by course id
router.get("/:_id", async (req, res) => {
  const { _id } = req.params;
  try {
    const courseFound = await Course.findById({ _id })
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

// upload new course
router.post("/", async (req, res) => {
  const { title, description, price } = req.body;

  // Validate data with courseSchema
  const { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  if (req.user.isStudent()) {
    return res
      .status(400)
      .send(
        "Only instructors can upload new courses. If you are already an instructor, please use your instructor account to access this feature."
      );
  }
  try {
    const newCourse = new Course({
      title,
      description,
      price,
      instructor: req.user._id,
    });
    const savedCourse = await newCourse.save();
    return res.send({
      message: "Course Uploaded.",
      savedCourse,
    });
  } catch (e) {
    return res.status(500).send("Upload Course Failed.");
  }
});

// Let students use userID to register for a course
router.post("/enroll/:_id", async (req, res) => {
  const { _id } = req.params;
  try {
    const course = await Course.findById({ _id }).exec();
    course.students.push(req.user._id); // JWT 內有使用者資訊
    await course.save();
    return res.send("Course Registered!");
  } catch (e) {
    return res.status(500).send(e);
  }
});

// edit course information
router.patch("/:_id", async (req, res) => {
  const { _id } = req.params;

  // Validate update informations are valid for courseSchema
  const { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //   Confirm that course id match to a true course
  try {
    const course = await Course.findById({ _id }).exec();
    if (!course) {
      return res
        .status(400)
        .send("Course Not Found. Can not edit course information");
    }

    // validate the user who want to update course is the instructor
    if (course.instructor.equals(req.user._id)) {
      const updatedCourse = await Course.findByIdAndUpdate({ _id }, req.body, {
        new: true,
        runValidators: true,
      });
      return res.send({
        message: "Course Information Updated!",
        updatedCourse,
      });
    } else {
      return res
        .status(403)
        .send("Sorry, Only the course instructor could update this course.");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

// delete course
router.delete("/:_id", async (req, res) => {
  const { _id } = req.params;

  //   Confirm indeed has a course match to course id
  try {
    const course = await Course.findById({ _id }).exec();
    if (!course) {
      return res.status(400).send("Course Not Found. Can not delete course.");
    }

    // validate the user who want to delete course is the instructor
    if (course.instructor.equals(req.user._id)) {
      await Course.findByIdAndDelete({ _id }).exec();
      return res.send("Course Deleted!");
    } else {
      return res
        .status(403)
        .send("Sorry, Only the course instructor could delete this course.");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

module.exports = router;
