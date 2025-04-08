import { deck as baseDeck } from "./const";
import { evaluateHand } from "./evaluate";
import { drawRandomCards } from "./training";
import { Board, Card, Hand } from "./type";

const splitHand = (hand: Hand): [Card, Card] => {
  return [hand.slice(0, 2) as Card, hand.slice(2, 4) as Card];
};

/**
 * イテレーションして得られた各プレイヤーのスコアを集計する関数
 */
export const aggregateScores = (
  player1Hand: Hand,
  player2Hand: Hand,
  iterations: number = 1000,
  player3Hand?: Hand,
  player4Hand?: Hand
) => {
  const deck = [...baseDeck];

  // 自分と相手のハンドをデッキから除外
  const usedCards = new Set([
    ...splitHand(player1Hand),
    ...splitHand(player2Hand),
    ...(player3Hand ? splitHand(player3Hand) : []),
    ...(player4Hand ? splitHand(player4Hand) : []),
  ]);
  const filteredDeck = deck.filter((card) => !usedCards.has(card));

  const scores: {
    player1: number;
    player2: number;
    player3: number;
    player4: number;
  }[] = [];

  for (let i = 0; i < iterations; i++) {
    // コミュニティカードを配る（5枚）
    const board: Board = drawRandomCards([...filteredDeck], 5) as Board;

    // 勝敗を判定
    const player1Score = evaluateHand(player1Hand, board);
    const player2Score = evaluateHand(player2Hand, board);
    const player3Score = player3Hand
      ? evaluateHand(player3Hand, board)
      : -Infinity;
    const player4Score = player4Hand
      ? evaluateHand(player4Hand, board)
      : -Infinity;

    scores.push({
      player1: player1Score,
      player2: player2Score,
      player3: player3Score,
      player4: player4Score,
    });
  }

  return scores;
};

export const calculateWinRateFromScores = (
  scores: {
    player1: number;
    player2: number;
    player3: number;
    player4: number;
  }[],
  allInPlayers: ("player1" | "player2" | "player3" | "player4")[]
) => {
  const winCounts: Record<
    "player1" | "player2" | "player3" | "player4",
    number
  > = {
    player1: 0,
    player2: 0,
    player3: 0,
    player4: 0,
  };
  for (const score of scores) {
    // allInPlayers の中で最大スコアを持つプレイヤーを特定
    let maxScore = -Infinity;
    let winners: ("player1" | "player2" | "player3" | "player4")[] = [];

    for (const player of allInPlayers) {
      if (score[player] > maxScore) {
        maxScore = score[player];
        winners = [player];
      } else if (score[player] === maxScore) {
        winners.push(player);
      }
    }

    // 勝者をカウント（引き分けの場合は均等に分配）
    const winIncrement = 1 / winners.length;
    for (const winner of winners) {
      winCounts[winner] += winIncrement;
    }
  }

  // 勝率を計算
  return {
    player1: winCounts.player1 / scores.length,
    player2: winCounts.player2 / scores.length,
    player3: winCounts.player3 / scores.length,
    player4: winCounts.player4 / scores.length,
  };
};
