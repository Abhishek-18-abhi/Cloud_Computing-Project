import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();

console.log(`[build.js] Current working directory: ${cwd}`);

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

// 1. If we are in the root directory (has my-react-app folder)
if (fs.existsSync(path.join(cwd, "my-react-app", "package.json"))) {
  console.log("[build.js] Root directory detected. Building React frontend in my-react-app...");
  execSync("npm --prefix my-react-app install", { stdio: "inherit" });
  execSync("npm --prefix my-react-app run build", { stdio: "inherit" });

  const reactDist = path.join(cwd, "my-react-app", "dist");
  const rootDist = path.join(cwd, "dist");
  if (fs.existsSync(reactDist)) {
    copyFolderSync(reactDist, rootDist);
    console.log("[build.js] Mirrored build output to ./dist and ./my-react-app/dist");
  }
}
// 2. If we are inside my-react-app (has vite.config.js or src/App.jsx)
else if (fs.existsSync(path.join(cwd, "vite.config.js")) || fs.existsSync(path.join(cwd, "src", "App.jsx"))) {
  console.log("[build.js] my-react-app directory detected. Building directly with Vite...");
  execSync("npm run build", { stdio: "inherit" });

  const dist = path.join(cwd, "dist");
  const nestedDist = path.join(cwd, "my-react-app", "dist");
  if (fs.existsSync(dist)) {
    copyFolderSync(dist, nestedDist);
    console.log("[build.js] Mirrored build output to ./dist and ./my-react-app/dist");
  }
}
// 3. If we are inside backend or auxiliary directory
else {
  console.log("[build.js] Backend directory detected. Creating fallback static placeholder...");
  const dist = path.join(cwd, "dist");
  const nestedDist = path.join(cwd, "my-react-app", "dist");
  fs.mkdirSync(dist, { recursive: true });
  fs.writeFileSync(
    path.join(dist, "index.html"),
    "<!DOCTYPE html><html><head><title>ElectroHub API</title></head><body><h1>ElectroHub Backend Service Online</h1></body></html>"
  );
  copyFolderSync(dist, nestedDist);
  console.log("[build.js] Static fallback index created for backend deployment.");
}

console.log("[build.js] Build completed successfully.");
