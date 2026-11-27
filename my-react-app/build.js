import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const cwd = process.cwd();
console.log(`[my-react-app/build.js] Current working directory: ${cwd}`);

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

execSync("npm run build", { stdio: "inherit" });
const dist = path.join(cwd, "dist");
const nestedDist = path.join(cwd, "my-react-app", "dist");
if (fs.existsSync(dist)) {
  copyFolderSync(dist, nestedDist);
  console.log("[my-react-app/build.js] Mirrored build output to ./dist and ./my-react-app/dist");
}
console.log("[my-react-app/build.js] Frontend build ready.");
