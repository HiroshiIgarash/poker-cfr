export type Card = `${Rank}${Suit}`; // 例: "Ah"（エースハート）
export type Hand = `${Card}${Card}`; // 例: "AhKh"（エースハートとキングハート）
export type Board = [Card, Card, Card, Card, Card]; // コミュニティカードの配列

export type Rank =
  | "A"
  | "K"
  | "Q"
  | "J"
  | "T"
  | "9"
  | "8"
  | "7"
  | "6"
  | "5"
  | "4"
  | "3"
  | "2"; // ランク（2からAまで）
export type Suit = "h" | "d" | "c" | "s"; // スート（ハート、ダイヤ、クラブ、スペード）

// 役の種類を表す列挙型
export enum HandRank {
  HIGH_CARD = 0,
  ONE_PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
}

// スコア計算用の係数
export const SCORE_FACTORS = {
  PRIMARY: 100,
  SECONDARY: 10000,
  TERTIARY: 1000000,
  QUATERNARY: 100000000,
  QUINARY: 10000000000,
};
