/* global process */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const cwd = process.cwd();

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

console.log(`[build.js] Building frontend from: ${cwd}`);
execSync("npm run build", { stdio: "inherit" });

const dist = path.join(cwd, "dist");
const nestedDist = path.join(cwd, "my-react-app", "dist");
if (fs.existsSync(dist)) {
  copyFolderSync(dist, nestedDist);
}
console.log("[build.js] Build completed successfully.");
