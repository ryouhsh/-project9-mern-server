const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseSchema = new Schema({
  id: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  instructor: {
    type: Schema.Types.ObjectId, // MongoDB 中的 primary key
    ref: "User", // 連結到的model
  },
  students: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("Course", courseSchema);
