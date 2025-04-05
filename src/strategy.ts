import { beforeRegret } from "./beforeRegret";
import { beforeStrategy } from "./beforeStrategy";

// 戦略を格納するオブジェクト
export const strategy: Record<string, number> = beforeStrategy;
export const regret: Record<string, { allIn: number; fold: number }> =
  beforeRegret;
// export const strategy: Record<string, number> = {};
// export const regret: Record<string, { allIn: number; fold: number }> = {};

// 手札の組み合わせを生成
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const positions = [
  "CO",
  "A_BTN",
  "F_BTN",
  "A_A_SB",
  "A_F_SB",
  "F_A_SB",
  "F_F_SB",
  "A_A_A_BB",
  "A_A_F_BB",
  "A_F_A_BB",
  "A_F_F_BB",
  "F_A_A_BB",
  "F_A_F_BB",
  "F_F_A_BB",
];

// スーテッドとオフスーテッドの組み合わせを生成
// for (const pos of positions) {
//   for (let i = 0; i < ranks.length; i++) {
//     for (let j = i; j < ranks.length; j++) {
//       if (i === j) {
//         // ペアの場合
//         strategy[`${pos}_${ranks[i]}${ranks[j]}`] = 0.5;
//         regret[`${pos}_${ranks[i]}${ranks[j]}`] = { allIn: 0, fold: 0 };
//       } else {
//         // スーテッド
//         strategy[`${pos}_${ranks[i]}${ranks[j]}s`] = 0.5;
//         regret[`${pos}_${ranks[i]}${ranks[j]}s`] = { allIn: 0, fold: 0 };
//         // オフスーテッド
//         strategy[`${pos}_${ranks[i]}${ranks[j]}o`] = 0.5;
//         regret[`${pos}_${ranks[i]}${ranks[j]}o`] = { allIn: 0, fold: 0 };
//       }
//     }
//   }
// }
