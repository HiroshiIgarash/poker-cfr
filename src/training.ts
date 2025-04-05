import { deck as baseDeck, RANK_ORDER } from "./const";
import { aggregateScores, calculateWinRateFromScores } from "./game";
import { regret, strategy } from "./strategy";
import { Card, Hand } from "./type";
import fs from "fs";

const RAKE = 0.01;

// deckから指定枚数ランダムに引く関数
export function drawRandomCards(deck: Card[], count: number): Card[] {
  const selectedCards: Card[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * deck.length);
    selectedCards.push(deck[randomIndex]);
    deck.splice(randomIndex, 1); // デッキから選んだカードを取り除く
  }
  return selectedCards;
}

const getKey = (hand: Hand) => {
  const hand1 = hand.slice(0, 2) as Card;
  const hand2 = hand.slice(2, 4) as Card;
  const handRanks = [hand1, hand2]
    .sort((a, b) => {
      return RANK_ORDER.indexOf(a[0]) - RANK_ORDER.indexOf(b[0]);
    })
    .map((card) => card[0])
    .join("");

  const isSameRank = hand1[0] === hand2[0];
  const isSameSuit = hand1[1] === hand2[1];
  if (isSameRank) {
    return handRanks;
  } else if (isSameSuit) {
    return handRanks + "s";
  } else {
    return handRanks + "o";
  }
};

export const play = () => {
  const deck = [...baseDeck];
  const hands = drawRandomCards(deck, 8); // 8枚のカードをランダムに引く
  const coHand = hands.slice(0, 2).join("") as Hand;
  const btnHand = hands.slice(2, 4).join("") as Hand;
  const sbHand = hands.slice(4, 6).join("") as Hand;
  const bbHand = hands.slice(6, 8).join("") as Hand;

  const scores = aggregateScores(coHand, btnHand, 1000, sbHand, bbHand);

  const winRateMap = {
    A: {
      A: {
        A: {
          // CO, BTN, SB, BB
          A: calculateWinRateFromScores(scores, [
            "player1",
            "player2",
            "player3",
            "player4",
          ]),
          // CO, BTN, SB
          F: calculateWinRateFromScores(scores, [
            "player1",
            "player2",
            "player3",
          ]),
        },
        F: {
          // CO, BTN, BB
          A: calculateWinRateFromScores(scores, [
            "player1",
            "player2",
            "player4",
          ]),
          // CO, BTN
          F: calculateWinRateFromScores(scores, ["player1", "player2"]),
        },
      },
      F: {
        A: {
          // CO, SB, BB
          A: calculateWinRateFromScores(scores, [
            "player1",
            "player3",
            "player4",
          ]),
          // CO, SB
          F: calculateWinRateFromScores(scores, ["player1", "player3"]),
        },
        F: {
          // CO, BB
          A: calculateWinRateFromScores(scores, ["player1", "player4"]),
          F: {
            player1: 1,
            player2: 0,
            player3: 0,
            player4: 0,
          },
        },
      },
    },
    F: {
      A: {
        A: {
          // BTN, SB, BB
          A: calculateWinRateFromScores(scores, [
            "player2",
            "player3",
            "player4",
          ]),
          // BTN, SB
          F: calculateWinRateFromScores(scores, ["player2", "player3"]),
        },
        F: {
          // BTN, BB
          A: calculateWinRateFromScores(scores, ["player2", "player4"]),
          F: {
            player1: 0,
            player2: 1,
            player3: 0,
            player4: 0,
          },
        },
      },
      F: {
        A: {
          // SB, BB
          A: calculateWinRateFromScores(scores, ["player3", "player4"]),
          F: {
            player1: 0,
            player2: 0,
            player3: 1,
            player4: 0,
          },
        },
        F: {
          A: {
            player1: 0,
            player2: 0,
            player3: 0,
            player4: 1,
          },
        },
      },
    },
  };

  // CO の各利得を計算する
  let co_allInBenefit = 0;
  for (let btn_action of ["A", "F"] as const) {
    for (let sb_action of ["A", "F"] as const) {
      for (let bb_action of ["A", "F"] as const) {
        // 勝った時の利益 (参加した敵の数 * 8 + SB,BB分)
        const winBenefit =
          ((btn_action === "A" ? 8 : 0) +
            (sb_action === "A" ? 8 : 0.5) +
            (bb_action === "A" ? 8 : 1)) *
          (1 - RAKE);

        // そのルートに至る確率
        const p =
          (btn_action === "A"
            ? strategy[`A_BTN_${getKey(btnHand)}`]
            : 1 - strategy[`A_BTN_${getKey(btnHand)}`]) *
          (sb_action === "A"
            ? strategy[`A_${btn_action}_SB_${getKey(sbHand)}`]
            : 1 - strategy[`A_${btn_action}_SB_${getKey(sbHand)}`]) *
          (bb_action === "A"
            ? strategy[`A_${btn_action}_${sb_action}_BB_${getKey(bbHand)}`]
            : 1 -
              strategy[`A_${btn_action}_${sb_action}_BB_${getKey(bbHand)}`]);

        co_allInBenefit +=
          // 勝った時の期待値
          winBenefit *
            p *
            winRateMap["A"][btn_action][sb_action][bb_action].player1 +
          // 負けた時の期待値
          -8 *
            p *
            (1 - winRateMap["A"][btn_action][sb_action][bb_action].player1);
      }
    }
  }

  const co_foldBenefit = 0;

  updateStrategy(`CO_${getKey(coHand)}`, co_allInBenefit, co_foldBenefit);

  // BTNの各利得を計算する
  for (let co_action of ["A", "F"] as const) {
    let btn_allInBenefit = 0;
    for (let sb_action of ["A", "F"] as const) {
      for (let bb_action of ["A", "F"] as const) {
        // 勝った時の利益 (参加した敵の数 * 8 + SB,BB分)
        const winBenefit =
          ((co_action === "A" ? 8 : 0) +
            (sb_action === "A" ? 8 : 0.5) +
            (bb_action === "A" ? 8 : 1)) *
          (1 - RAKE);

        // そのルートに至る確率
        const p =
          (co_action === "A"
            ? strategy[`CO_${getKey(coHand)}`]
            : 1 - strategy[`CO_${getKey(coHand)}`]) *
          (sb_action === "A"
            ? strategy[`${co_action}_A_SB_${getKey(sbHand)}`]
            : 1 - strategy[`${co_action}_A_SB_${getKey(sbHand)}`]) *
          (bb_action === "A"
            ? strategy[`${co_action}_A_${sb_action}_BB_${getKey(bbHand)}`]
            : 1 - strategy[`${co_action}_A_${sb_action}_BB_${getKey(bbHand)}`]);

        btn_allInBenefit +=
          // 勝った時の期待値
          winBenefit *
            p *
            winRateMap[co_action]["A"][sb_action][bb_action].player2 +
          // 負けた時の期待値
          -8 *
            p *
            (1 - winRateMap[co_action]["A"][sb_action][bb_action].player2);
      }
    }
    const btn_foldBenefit = 0;
    updateStrategy(
      `${co_action}_BTN_${getKey(btnHand)}`,
      btn_allInBenefit,
      btn_foldBenefit
    );
  }

  // SBの各利得を計算する
  for (let co_action of ["A", "F"] as const) {
    for (let btn_action of ["A", "F"] as const) {
      let sb_allInBenefit = 0;
      for (let bb_action of ["A", "F"] as const) {
        // 勝った時の利益 (参加した敵の数 * 8 + SB,BB分)
        const winBenefit =
          ((co_action === "A" ? 8 : 0) +
            (btn_action === "A" ? 8 : 0) +
            (bb_action === "A" ? 8 : 1)) *
          (1 - RAKE);

        // そのルートに至る確率
        const p =
          (co_action === "A"
            ? strategy[`CO_${getKey(coHand)}`]
            : 1 - strategy[`CO_${getKey(coHand)}`]) *
          (btn_action === "A"
            ? strategy[`${co_action}_BTN_${getKey(btnHand)}`]
            : 1 - strategy[`${co_action}_BTN_${getKey(btnHand)}`]) *
          (bb_action === "A"
            ? strategy[`${co_action}_${btn_action}_A_BB_${getKey(bbHand)}`]
            : 1 -
              strategy[`${co_action}_${btn_action}_A_BB_${getKey(bbHand)}`]);

        sb_allInBenefit +=
          // 勝った時の期待値
          winBenefit *
            p *
            winRateMap[co_action][btn_action]["A"][bb_action].player3 +
          // 負けた時の期待値
          -8 *
            p *
            (1 - winRateMap[co_action][btn_action]["A"][bb_action].player3);
      }

      const sb_foldBenefit =
        -1 *
        (co_action === "A"
          ? strategy[`CO_${getKey(coHand)}`]
          : 1 - strategy[`CO_${getKey(coHand)}`]) *
        (btn_action === "A"
          ? strategy[`${co_action}_BTN_${getKey(btnHand)}`]
          : 1 - strategy[`${co_action}_BTN_${getKey(btnHand)}`]);

      updateStrategy(
        `${co_action}_${btn_action}_SB_${getKey(sbHand)}`,
        sb_allInBenefit,
        sb_foldBenefit
      );
    }
  }

  // BBの各利得を計算する
  for (let co_action of ["A", "F"] as const) {
    for (let btn_action of ["A", "F"] as const) {
      for (let sb_action of ["A", "F"] as const) {
        if (co_action === "F" && btn_action === "F" && sb_action === "F")
          continue;

        // 勝った時の利益 (参加した敵の数 * 8 + SB,BB分)
        const winBenefit =
          ((co_action === "A" ? 8 : 0) +
            (btn_action === "A" ? 8 : 0) +
            (sb_action === "A" ? 8 : 0.5)) *
          (1 - RAKE);

        // そのルートに至る確率
        const p =
          (co_action === "A"
            ? strategy[`CO_${getKey(coHand)}`]
            : 1 - strategy[`CO_${getKey(coHand)}`]) *
          (btn_action === "A"
            ? strategy[`${co_action}_BTN_${getKey(btnHand)}`]
            : 1 - strategy[`${co_action}_BTN_${getKey(btnHand)}`]) *
          (sb_action === "A"
            ? strategy[`${co_action}_${btn_action}_SB_${getKey(sbHand)}`]
            : 1 - strategy[`${co_action}_${btn_action}_SB_${getKey(sbHand)}`]);

        const bb_allInBenefit =
          // 勝った時の期待値
          winBenefit *
            p *
            winRateMap[co_action][btn_action][sb_action]["A"].player4 +
          // 負けた時の期待値
          -8 *
            p *
            (1 - winRateMap[co_action][btn_action][sb_action]["A"].player4);

        const bb_foldBenefit = -2 * p;

        updateStrategy(
          `${co_action}_${btn_action}_${sb_action}_BB_${getKey(bbHand)}`,
          bb_allInBenefit,
          bb_foldBenefit
        );
      }
    }
  }
};

/**
 * 戦略更新をする関数
 */
const updateStrategy = (
  key: string,
  allInBenefit: number,
  foldBenefit: number
) => {
  if (!regret[key]) console.log(`key: ${key}が見つかりません`);
  const benefitSum =
    allInBenefit * strategy[key] + foldBenefit * (1 - strategy[key]);

  const allInRegret = allInBenefit - benefitSum;
  const foldRegret = foldBenefit - benefitSum;

  regret[key].allIn += allInRegret;
  regret[key].fold += foldRegret;

  const positiveRegretAllIn = Math.max(0, regret[key].allIn);
  const positiveRegretFold = Math.max(0, regret[key].fold);

  const regretSum = positiveRegretAllIn + positiveRegretFold;
  if (regretSum) {
    // if (key.includes("A_A_SB")) {
    // if (strategy[key] !== positiveRegretAllIn / regretSum) {
    //   console.log(`${key} ${strategy[key]}→${positiveRegretAllIn / regretSum}`);
    // }
    // }
    strategy[key] = positiveRegretAllIn / regretSum;
  }
};
