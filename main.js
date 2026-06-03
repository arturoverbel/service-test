import express from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 8082;
const JWT_SECRET = "super-secret-for-testing";
const LAST_WEBHOOK_FILE = "./last-webhook.json";

// ======================================
// AUTH ENDPOINT
// ======================================

app.post("/auth/token", (req, res) => {
  const { client_id, client_secret } = req.body;

  const token = jwt.sign(
    {
      client_id: client_id || "test-client",
      role: "test-user"
    },
    JWT_SECRET,
    {
      expiresIn: "1h"
    }
  );

  res.json({
    access_token: token,
    token_type: "Bearer",
    expires_in: 3600,
    received_credentials: {
      client_id,
      client_secret
    }
  });
});

// ======================================
// WEBHOOK ENDPOINT
// ======================================

app.post("/webhook", (req, res) => {
  const authHeader = req.headers.authorization;

  let authentication = "none";
  let receivedToken = null;
  let decodedToken = null;

  if (authHeader) {
    authentication = "token";
    receivedToken = authHeader;

    try {
      const jwtToken = authHeader.replace(/^Bearer\s+/i, "");

      decodedToken = jwt.verify(
        jwtToken,
        JWT_SECRET
      );
    } catch (error) {
      decodedToken = {
        error: "Invalid JWT",
        details: error.message
      };
    }
  }

  const responseData = {
    timestamp: new Date().toISOString(),
    message: "Hello World",
    authentication,
    received_token: receivedToken,
    decoded_token: decodedToken,
    received_body: req.body
  };

  saveLastWebhook(responseData);

  res.json(responseData);
});

app.get("/webhook/last", (req, res) => {
    const lastWebhook = getLastWebhook();
  
    if (!lastWebhook) {
      return res.status(404).json({
        message: "No webhook has been received yet"
      });
    }
  
    res.json(lastWebhook);
  });

app.listen(PORT, () => {
  console.log(
    `Webhook test server running on http://localhost:${PORT}`
  );
});




function saveLastWebhook(data) {
    fs.writeFileSync(
      LAST_WEBHOOK_FILE,
      JSON.stringify(data, null, 2)
    );
  }
  
  function getLastWebhook() {
    if (!fs.existsSync(LAST_WEBHOOK_FILE)) {
      return null;
    }
  
    return JSON.parse(
      fs.readFileSync(LAST_WEBHOOK_FILE, "utf-8")
    );
  }