// Importing module
import express from "express";

const app = express();
// Use port from environment variable or default to 3000
const PORT: number = parseInt(process.env.PORT || "3000");

// Handling GET / Request
app.get("/", (req, res) => {
  res.send("Welcome to typescript backend!");
});

app.get("/submit", (req, res) => {});

// Server setup
app.listen(PORT, () => {
  console.log(
    "The application is listening " + "on port http://localhost:" + PORT
  );
});
