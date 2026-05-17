const express = require("express");
const mongoose = require("mongoose");
const { Request, Resource } = require("./models/models");
const { Parser } = require("json2csv");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/mydb")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.render("home");
});

// Export Requests CSV
app.get("/export-requests", async (req, res) => {
  try {
    const requests = await Request.find();
    const fields = ["name", "location", "type", "urgency", "status", "createdAt"];
    const parser = new Parser({ fields });
    const csv = parser.parse(requests);

    res.header("Content-Type", "text/csv");
    res.attachment("requests.csv");
    return res.send(csv);
  } catch (err) {
    res.status(500).send("❌ Error exporting CSV: " + err.message);
  }
});

// Export Resources CSV (optional)
app.get("/export-resources", async (req, res) => {
  try {
    const resources = await Resource.find();
    const fields = ["volunteerName", "type", "quantity", "location", "contact", "available"];
    const parser = new Parser({ fields });
    const csv = parser.parse(resources);

    res.header("Content-Type", "text/csv");
    res.attachment("resources.csv");
    return res.send(csv);
  } catch (err) {
    res.status(500).send("❌ Error exporting CSV: " + err.message);
  }
});

// Add Request
app.get("/add-request", (req, res) => res.render("add-request"));
app.post("/add-request", async (req, res) => {
  try {
    const { name, location, type, urgency } = req.body;
    await Request.create({ name, location, type, urgency, status: "Pending" });
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("❌ Error saving request: " + err.message);
  }
});

// Add Resource
app.get("/add-resource", (req, res) => res.render("add-resource"));
app.post("/add-resource", async (req, res) => {
  try {
    const { volunteerName, type, quantity, location, contact } = req.body;
    await Resource.create({ volunteerName, type, quantity, location, contact });
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("❌ Error saving resource: " + err.message);
  }
});

// Dashboard + Matching + Analytics
app.get("/dashboard", async (req, res) => {
  try {
    const { type, location, urgency, search } = req.query;

    let filter = {};
    if (type) filter.type = type;
    if (location) filter.location = location;
    if (urgency) filter.urgency = urgency;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { location: new RegExp(search, "i") }
      ];
    }

    let requests = await Request.find(filter);

    // Urgency prioritization
    const urgencyOrder = { Critical: 1, High: 2, Normal: 3 };
    requests.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    const resources = await Resource.find();

    // Matching logic
    let matches = [];
    for (let req of requests) {
      const resource = resources.find(
        r => r.type === req.type && r.location === req.location
      );
      if (resource) {
        matches.push({ request: req, resource, status: "Matched" });
      }
    }

    // Analytics
    const totalRequests = await Request.countDocuments();
    const fulfilledRequests = await Request.countDocuments({ status: "Fulfilled" });
    const pendingRequests = totalRequests - fulfilledRequests;

    res.render("dashboard", {
      requests,
      resources,
      matches,
      totalRequests,
      fulfilledRequests,
      pendingRequests
    });
  } catch (err) {
    res.status(500).send("❌ Error loading dashboard: " + err.message);
  }
});

// Fulfill request
app.post("/fulfill/:id", async (req, res) => {
  try {
    await Request.findByIdAndUpdate(req.params.id, { status: "Fulfilled" });
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("❌ Error updating status: " + err.message);
  }
});

app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
