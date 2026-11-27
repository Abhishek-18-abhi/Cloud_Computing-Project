import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const cwd = process.cwd();
console.log(`[backend/build.js] Current working directory: ${cwd}`);

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

const dist = path.join(cwd, "dist");
const nestedDist = path.join(cwd, "my-react-app", "dist");
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(
  path.join(dist, "index.html"),
  "<!DOCTYPE html><html><head><title>ElectroHub API</title></head><body><h1>ElectroHub Backend Service Online</h1></body></html>"
);
copyFolderSync(dist, nestedDist);
console.log("[backend/build.js] Backend build ready.");
