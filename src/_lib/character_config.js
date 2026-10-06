// src/_lib/character_config.js
import fs from "node:fs";

export function getCharacterConfig() {
  return JSON.parse(
    fs.readFileSync(
      "./src/_data/character_config.json",
      "utf8"
    )
  );
}