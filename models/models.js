const mongoose = require("mongoose");
const requestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, enum: ["food", "medicine", "shelter", "rescue"], required: true },
  urgency: { type: String, enum: ["Critical", "High", "Normal"], default: "Normal" },
  status: { type: String, enum: ["Pending", "Fulfilled"], default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});
const resourceSchema = new mongoose.Schema({
  volunteerName: { type: String, required: true },
  type: { type: String, enum: ["food", "medicine", "shelter"], required: true },
  quantity: { type: Number, required: true },
  location: { type: String, required: true },
  contact: { type: String, required: true },
  available: { type: Boolean, default: true }
});
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // store hashed password
  role: { type: String, enum: ["volunteer", "admin", "NGO"], default: "volunteer" }
});
const matchSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
  status: { type: String, enum: ["Matched", "Completed"], default: "Matched" },
  matchedAt: { type: Date, default: Date.now }
});
const Request = mongoose.model("Request", requestSchema);
const Resource = mongoose.model("Resource", resourceSchema);
const User = mongoose.model("User", userSchema);
const Match = mongoose.model("Match", matchSchema);
module.exports = { Request, Resource, User, Match };
