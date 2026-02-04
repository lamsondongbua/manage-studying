// verify-key.js
const https = require("https");
require("dotenv").config();

const apiKey = process.env.GEMINI_API_KEY;

const options = {
  hostname: "generativelanguage.googleapis.com",
  path: `/v1beta/models?key=${apiKey}`,
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};

const req = https.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Status Code:", res.statusCode);
    console.log("\nResponse:");

    try {
      const parsed = JSON.parse(data);
      if (parsed.models) {
        console.log("\n✅ API Key is VALID!");
        console.log("\nAvailable models:");
        parsed.models.forEach((model) => {
          console.log(`- ${model.name}`);
        });
      } else {
        console.log(JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on("error", (e) => {
  console.error("Error:", e.message);
});

req.end();
