import "./evaluate";
import "./game";
import "./strategy";
import "./training";
import { play } from "./training";
import fs from "fs";
import { regret, strategy } from "./strategy";

for (let j = 1; j <= 6000; j++) {
  for (let i = 0; i < 2000; i++) {
    play();
  }
  console.log(`${j * 2000}のイテレーションが終了`);
  fs.writeFileSync(
    "handrange.js",
    `const range = ${JSON.stringify(strategy)};`
  );
  fs.writeFileSync(
    "src/beforeStrategy.ts",
    `export const beforeStrategy = ${JSON.stringify(strategy)};`
  );
  fs.writeFileSync(
    "src/beforeRegret.ts",
    `export const beforeRegret = ${JSON.stringify(regret)};`
  );
}
console.log("beforeStrategy.tsとbeforeRegret.tsに書き込みました");
