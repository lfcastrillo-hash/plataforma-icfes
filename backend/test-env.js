const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

console.log("VARIABLE:");
console.log(process.env.GEMINI_API_KEY);
