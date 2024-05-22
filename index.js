const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("winter-clothes");
    const collection = db.collection("users");
    const winterCloths = db.collection("winterCloths");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // all winter cloths
    app.get("/winter-cloth", async (req, res) => {
      let result;
      const limit = Number(req.query.limit);
      if (limit) {
        result = await winterCloths.find({}).limit(limit).toArray();
        return res.send({
          success: true,
          message: "Winter cloth fetched successfully.",
          data: result,
        });
      }

      result = await winterCloths.find({}).toArray();
      res.send({
        success: true,
        message: "Winter cloth fetched successfully.",
        data: result,
      });
    });

    // single winter cloths
    app.get("/winter-cloth/:id", async (req, res) => {
      const { id } = req.params;
      const result = await winterCloths.findOne({ _id: new ObjectId(id) });
      res.send({
        success: true,
        message: "single winter cloth fetched successfully.",
        data: result,
      });
    });

    // create winter cloths
    app.post("/winter-cloth", async (req, res) => {
      const result = await winterCloths.insertOne(req.body);
      res.send({
        success: true,
        message: " winter cloth created successfully.",
        data: result,
      });
    });

    // delete winter cloths
    app.delete("/winter-cloth/:id", async (req, res) => {
      const { id } = req.params;
      const result = await winterCloths.deleteOne({ _id: new ObjectId(id) });
      res.send({
        success: true,
        message: " winter cloth deleted successfully.",
        data: result,
      });
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
