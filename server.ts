import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes for AGI Tools
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/tools/execute_code", async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "No code provided" });

    // Safety check: very basic
    if (code.includes("process.exit") || code.includes("require('child_process')")) {
      return res.json({ result: "[BLOCKED] Dangerous code detected." });
    }

    try {
      // For demo purposes, we'll execute simple JS code
      // In a real AGI system, this would be a sandboxed environment
      const result = eval(code);
      res.json({ result: String(result) });
    } catch (error: any) {
      res.json({ error: error.message });
    }
  });

  app.get("/api/tools/list_files", (req, res) => {
    const dir = (req.query.path as string) || ".";
    try {
      const files = fs.readdirSync(path.resolve(dir));
      res.json({ files });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
