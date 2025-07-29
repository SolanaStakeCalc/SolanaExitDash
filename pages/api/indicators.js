const fetch = require('node-fetch');

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

async function getSolanaPriceData() {
  const res = await fetch(`${COINGECKO_API}/coins/solana/market_chart?vs_currency=usd&days=14`);
  const json = await res.json();
  const prices = json.prices.map(p => p[1]);
  const peak = Math.max(...prices);
  const current = prices[prices.length - 1];
  const drop = ((peak - current) / peak) * 100;
  return { drop: Math.round(drop), prices };
}

function calculateRSI(closes) {
  let gains = 0, losses = 0;
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const rs = gains / (losses || 1);
  return Math.round(100 - (100 / (1 + rs)));
}

async function checkWeeklyRSIDivergence() {
  const res = await fetch(`${COINGECKO_API}/coins/solana/market_chart?vs_currency=usd&days=90`);
  const json = await res.json();
  const prices = json.prices.map(p => p[1]);
  const weekly = prices.filter((_, i) => i % 7 === 0);

  const prevRSI = calculateRSI(weekly.slice(0, weekly.length - 1));
  const latestRSI = calculateRSI(weekly.slice(-7));

  return { prevRSI, latestRSI, divergence: prevRSI >= 80 && latestRSI < prevRSI };
}

export default async function handler(req, res) {
  const solana = await getSolanaPriceData();
  const rsiData = await checkWeeklyRSIDivergence();

  const indicators = [
    { indicator: "Unstaking Volume", conditionMet: true, weight: 2 },
    { indicator: "Funding Rate", conditionMet: true, weight: 2 },
    { indicator: "Open Interest Drop", conditionMet: false, weight: 1 },
    { indicator: "Price Drop from Peak", conditionMet: solana.drop >= 10, weight: 1 },
    { indicator: "RSI Weekly Divergence", conditionMet: rsiData.divergence, weight: 1 },
    { indicator: "Social Sentiment Spike", conditionMet: true, weight: 1 },
    { indicator: "Whale Outflows", conditionMet: true, weight: 2 }
  ];

  const totalScore = indicators.reduce((sum, i) => sum + i.weight, 0);
  const score = indicators.reduce((sum, i) => sum + (i.conditionMet ? i.weight : 0), 0);
  const confidence = Math.round((score / totalScore) * 100);

  res.status(200).json({ indicators, score, totalScore, confidence });
}
