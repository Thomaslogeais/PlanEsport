import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const count = await p.bracket.count();
console.log("Brackets en BDD :", count);
await p.$disconnect();
