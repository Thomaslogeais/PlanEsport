import { createRequire } from "module";
import { existsSync } from "fs";

const require = createRequire(import.meta.url);
const dotenv = require("dotenv");

dotenv.config({ path: ".env" });
if (existsSync(".env.local")) {
  dotenv.config({ path: ".env.local", override: true });
}

const url = process.env.DATABASE_URL || "NON DEFINI";

// Affiche juste les 60 premiers chars pour ne pas exposer le mot de passe
console.log("DATABASE_URL (60 chars):", url.substring(0, 60) + "...");

// Vérifie si c'est Neon
if (url.includes("neon.tech")) {
  console.log("✓ Pointe vers Neon.tech");
} else if (url.includes("localhost") || url.includes("127.0.0.1")) {
  console.log("⚠ Pointe vers une base LOCALE — pas Neon !");
} else {
  console.log("? URL inconnue — vérifiez manuellement.");
}
