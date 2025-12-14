import express from "express";

import { config, createError } from "./config.js";

import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();

//----------- Static/USE Block

import { middlewareLogResponse, middlewareMetricsInc } from "./api/middleware.js";
app.use(middlewareLogResponse);
app.use("/app", middlewareMetricsInc, express.static("./src/app"));

app.use(express.json()); // Global validation

//----------- GET Block

import { handlerReadiness } from "./api/readiness.js";
app.get("/api/healthz", handlerReadiness);

app.get("/admin/metrics", (req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`
    <html>
      <body>
        <h1>Welcome, Chirpy Admin</h1>
        <p>Chirpy has been visited ${config.api.fileServerHits} times!</p>
      </body>
    </html>
  `);
});

import { readAllChirpsHandler } from "./api/chirp_related.js";
app.get("/api/chirps", readAllChirpsHandler);
import { readChirpHandler } from "./api/chirp_related.js";
app.get("/api/chirps/:chirpID", readChirpHandler);

import { getBearerToken } from "./api/auth.js";
app.get("/api/users", getBearerToken);

//----------- POST Block

app.post("/api/reset", (req, res) => {
  config.api.fileServerHits = 0;
  res.status(200).json({
    FSH: config.api.fileServerHits
  });
});

import { userSignIn } from "./api/auth.js";
app.post("/api/users", userSignIn);
import { userLogin } from "./api/auth.js";
app.post("/api/login", userLogin);
import { refreshTokenHandler } from "./api/auth.js";
app.post("/api/refresh", refreshTokenHandler);
import { revokeRFThandler } from "./api/auth.js";
app.post("/api/revoke", revokeRFThandler);

import { createChirpHandler } from "./api/chirp_related.js";
app.post("/api/chirps", createChirpHandler);

import { rDB_Handler } from "./admin/resetting_db.js";
app.post("/admin/reset", rDB_Handler);

import { userToUpgrade } from "./api/polka_related.js";
app.post("/api/polka/webhooks", userToUpgrade);

//----------- PUT Block

import { updateAccount } from "./api/auth.js";
app.put("/api/users", updateAccount);

//----------- DELETE Block

import { deleteChirp } from "./api/chirp_related.js";
app.delete("/api/chirps/:chirpID", deleteChirp)

//----------- Diverse Block

import { errorHandler } from "./api/error_handling.js";
app.use(errorHandler); // shall be last

app.listen(config.api.port, () => {
  console.log(`Server is running at http://localhost:${config.api.port}`);
});
