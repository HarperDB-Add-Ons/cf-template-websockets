import fs from "fs";
import { fileURLToPath } from "url";

export const config = JSON.parse(
  fs.readFileSync(fileURLToPath(new URL("../config.json", import.meta.url)))
);
