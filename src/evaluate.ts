import { RANK_ORDER } from "./const";
import { Board, Card, Hand, Rank, Suit } from "./type";

export function evaluateHand(hand: Hand, board: Board): number {
  /** 自分の手札とボードのカードを合わせた7枚 */
  const allCards = [...hand.match(/.{1,2}/g)!, ...board] as [
    Card,
    Card,
    Card,
    Card,
    Card,
    Card,
    Card
  ];

  /** 各ランクの枚数（0枚は含まない） */
  const rankCounts = allCards.reduce<Record<Rank, number>>((acc, card) => {
    const rank = card[0] as Rank;
    acc[rank] = (acc[rank] || 0) + 1;
    return acc;
  }, {} as Record<Rank, number>);

  /** 各スートの枚数（0枚も含まない） */
  const suitCounts = allCards.reduce<Record<Suit, number>>((acc, card) => {
    const suit = card[1] as Suit;
    acc[suit] = (acc[suit] || 0) + 1;
    return acc;
  }, {} as Record<Suit, number>);

  /**
   * ランクの配列を渡して、ストレートかどうかを判断する
   * 引数のランクは昇順である必要がある
   */
  const searchStraight = (ranks: Rank[]) => {
    const string = ranks.join("");
    const straightKind = [
      "AKQJT",
      "KQJT9",
      "QJT98",
      "JT987",
      "T9876",
      "98765",
      "87654",
      "76543",
      "65432",
    ];
    for (const kind of straightKind) {
      if (string.includes(kind)) {
        return { isStraight: true, highCard: kind[0] as Rank };
      }
    }
    if (string.includes("5432") && string.includes("A")) {
      return { isStraight: true, highCard: "5" as Rank };
    }
    return { isStraight: false, highCard: undefined };
  };

  // フラッシュ判定
  const flushSuit = Object.entries(suitCounts).find(
    ([_, count]) => count >= 5
  )?.[0] as Suit | undefined;
  /** 同じスートのカード（ランクの順は降順） */
  const flushCards = allCards
    .filter((card) => card[1] === flushSuit)
    .sort((a, b) => RANK_ORDER.indexOf(b[0]) - RANK_ORDER.indexOf(a[0]));
  const isFlush = flushCards.length >= 5;

  // ストレート判定
  /** ランクを降順に並べたもの */
  const rankKeys = (Object.entries(rankCounts) as [Rank, number][])
    .map(([rank]) => rank)
    .sort((a, b) => RANK_ORDER.indexOf(b) - RANK_ORDER.indexOf(a));
  const straight = searchStraight(rankKeys);
  const isStraight = straight.isStraight;

  // ストレートフラッシュ判定
  const straightFlush = searchStraight(
    flushCards.map((card) => card[0] as Rank)
  );
  const isStraightFlush = straightFlush.isStraight;

  // フルハウス、フォーカード、スリーカード、ペア判定
  const rankCountsValues = Object.values(rankCounts).sort((a, b) => b - a);
  const isFourOfAKind = rankCountsValues[0] === 4;
  const isFullHouse = rankCountsValues[0] === 3 && rankCountsValues[1] >= 2;
  const isThreeOfAKind = rankCountsValues[0] === 3 && !isFullHouse;
  const isTwoPair = rankCountsValues[0] === 2 && rankCountsValues[1] === 2;
  const isOnePair = rankCountsValues[0] === 2 && !isTwoPair;

  // キッカーを考慮した役の強さを数値化（大きいほど強い）
  let score = 0;
  if (isStraightFlush) {
    // ストレートフラッシュを構成するカードを特定
    const straightFlush = searchStraight(
      flushCards.map((card) => card[0] as Rank)
    );
    const straightFlushHighCard = straightFlush.highCard;

    if (straightFlushHighCard) {
      score = 8 + RANK_ORDER.indexOf(straightFlushHighCard) / 100; // ストレートフラッシュ
    }
    return score;
  } else if (isFourOfAKind) {
    const fourOfAKindRank = (
      Object.entries(rankCounts) as [Rank, number][]
    ).filter(([_, count]) => count === 4)[0][0];
    const kicker = (Object.entries(rankCounts) as [Rank, number][])
      .filter(([_, count]) => count !== 4)
      .sort((a, b) => {
        const cardARank = a[0];
        const cardBRank = b[0];
        return RANK_ORDER.indexOf(cardBRank) - RANK_ORDER.indexOf(cardARank);
      })[0][0];

    score =
      7 +
      RANK_ORDER.indexOf(fourOfAKindRank) / 100 +
      RANK_ORDER.indexOf(kicker) / 10000; // フォーカード + キッカー
  } else if (isFullHouse) {
    const threeOfAKindRank = (Object.entries(rankCounts) as [Rank, number][])
      .filter(([, count]) => count === 3)
      .sort((a, b) => {
        const cardARank = a[0];
        const cardBRank = b[0];
        return RANK_ORDER.indexOf(cardBRank) - RANK_ORDER.indexOf(cardARank);
      })[0][0];
    const pairRank = (Object.entries(rankCounts) as [Rank, number][])
      .filter(([rank, count]) => rank !== threeOfAKindRank && count >= 2)
      .sort((a, b) => {
        const cardARank = a[0];
        const cardBRank = b[0];
        return RANK_ORDER.indexOf(cardBRank) - RANK_ORDER.indexOf(cardARank);
      })[0][0];
    score =
      6 +
      RANK_ORDER.indexOf(threeOfAKindRank) / 100 +
      RANK_ORDER.indexOf(pairRank) / 10000; // フルハウス
  } else if (isFlush) {
    const flushRanks = flushCards
      .map((card) => card[0] as Rank)
      .sort((a, b) => RANK_ORDER.indexOf(b) - RANK_ORDER.indexOf(a)); //カードがランク降順に並んでいる

    // スコアにフラッシュのカードを反映（最大5枚）
    score =
      5 +
      RANK_ORDER.indexOf(flushRanks[0]) / 100 + // 1枚目のカード
      (flushRanks[1] ? RANK_ORDER.indexOf(flushRanks[1]) / 10000 : 0) + // 2枚目のカード
      (flushRanks[2] ? RANK_ORDER.indexOf(flushRanks[2]) / 1000000 : 0) + // 3枚目のカード
      (flushRanks[3] ? RANK_ORDER.indexOf(flushRanks[3]) / 100000000 : 0) + // 4枚目のカード
      (flushRanks[4] ? RANK_ORDER.indexOf(flushRanks[4]) / 10000000000 : 0); // 5枚目のカード
  } else if (isStraight) {
    score = 4 + RANK_ORDER.indexOf(straight.highCard || "2") / 100; // ストレート
  } else if (isThreeOfAKind) {
    const threeOfAKindRank = (
      Object.entries(rankCounts) as [Rank, number][]
    ).filter(([, count]) => count === 3)[0][0];
    const kickers = (Object.entries(rankCounts) as [Rank, number][])
      .filter(([rank, count]) => count !== 3)
      .map(([rank]) => rank)
      .sort((a, b) => RANK_ORDER.indexOf(b) - RANK_ORDER.indexOf(a));
    score =
      3 +
      RANK_ORDER.indexOf(threeOfAKindRank) / 100 +
      RANK_ORDER.indexOf(kickers[0]) / 10000 + // 1枚目のキッカー
      RANK_ORDER.indexOf(kickers[1]) / 1000000; // 2枚目のキッカー
  } else if (isTwoPair) {
    const [highPairRank, lowPairRank] = (
      Object.entries(rankCounts) as [Rank, number][]
    )
      .filter(([, count]) => count === 2)
      .map(([rank]) => rank)
      .sort((a, b) => {
        return RANK_ORDER.indexOf(b) - RANK_ORDER.indexOf(a);
      });
    const kicker = (Object.entries(rankCounts) as [Rank, number][])
      .filter(([rank, count]) => rank !== highPairRank && rank !== lowPairRank)
      .map(([rank]) => rank)
      .sort((a, b) => {
        return RANK_ORDER.indexOf(b) - RANK_ORDER.indexOf(a);
      })[0];
    score =
      2 +
      RANK_ORDER.indexOf(highPairRank) / 100 + // 高い方のペア
      RANK_ORDER.indexOf(lowPairRank) / 10000 + // 低い方のペア
      RANK_ORDER.indexOf(kicker) / 1000000; // キッカー
  } else if (isOnePair) {
    const pairRank = (Object.entries(rankCounts) as [Rank, number][]).filter(
      ([, count]) => count === 2
    )[0][0];

    const kickers = (Object.entries(rankCounts) as [Rank, number][])
      .filter(([rank, count]) => rank !== pairRank)
      .map(([rank]) => rank)
      .sort((a, b) => RANK_ORDER.indexOf(b) - RANK_ORDER.indexOf(a));

    score =
      1 +
      RANK_ORDER.indexOf(pairRank) / 100 +
      RANK_ORDER.indexOf(kickers[0]) / 10000 + // 1枚目のキッカー
      RANK_ORDER.indexOf(kickers[1]) / 1000000 + // 2枚目のキッカー
      RANK_ORDER.indexOf(kickers[2]) / 100000000; // 3枚目のキッカー
  } else {
    const highCards = rankKeys.slice(5); // 上位5枚のカード
    score =
      RANK_ORDER.indexOf(highCards[0]) / 100 + // 1枚目のカード
      RANK_ORDER.indexOf(highCards[1]) / 10000 + // 2枚目のカード
      RANK_ORDER.indexOf(highCards[2]) / 1000000 + // 3枚目のカード
      RANK_ORDER.indexOf(highCards[3]) / 100000000 + // 4枚目のカード
      RANK_ORDER.indexOf(highCards[4]) / 10000000000; // 5枚目のカード
  }

  return score;
}

// const hand = "AhAc";
// const board = ["8h", "Jd", "Kh", "Th", "Qh"] as Board;
// console.log(evaluateHand(hand, board));
