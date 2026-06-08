import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "./test.js";

const app = express();

app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public")));

app.get("/api/test", (_req, res) => {
  res.json(test());
});

export default app;