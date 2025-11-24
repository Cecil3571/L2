export interface Scenario {
  id: string;
  title: string;
  description: string;
  imagePrompt: string; // For the image generator
  tldrResponse: string;
  fullResponse: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "bull_flag",
    title: "Bull Flag Breakout",
    description: "Price consolidating at VWAP with lighter volume, bids stacking up.",
    imagePrompt: "Level 2 market data showing bullish consolidation. Price consolidating near VWAP. Green bids stacking at 42.50. Ask side thinning out. Time and sales showing green prints.",
    tldrResponse: `> TL;DR ANALYSIS
STATUS: BUYERS IN CONTROL
MOMENTUM: Coiling at VWAP
INFLECTION: 152.50 (Ask Wall Eroding)
NEXT 30s: Breakout thru .50 likely
ACTION: LONG BIAS - Lift the offer on volume spike`,
    fullResponse: `> FULL TAPE REVIEW
----------------------------------------
1. STRUCTURE
- Classic bull flag consolidation above VWAP
- Bids holding firm at 152.40, stepping up
- Ask wall at 152.50 is being chipped away (refreshing slowed)

2. ORDER FLOW
- T&S shows consistent green prints (lifts)
- Hidden buyer likely at 152.45 (iceberg)
- Sellers are passive, not reloading

3. SCENARIO
- Continuation play imminent
- If 152.50 clears, vacuum to 152.80
- Watch for volume surge on the break

> ACTIONABLE SETUP
Long 152.50 break. Stop 152.35. Target 152.80.`
  },
  {
    id: "bear_trap",
    title: "Bear Trap / Reclaim",
    description: "Price dipped below support but immediately stuffed and reclaimed.",
    imagePrompt: "Level 2 market data showing a bear trap. Price dipping below support line but green bids appearing aggressively. Time and sales showing rapid buying.",
    tldrResponse: `> TL;DR ANALYSIS
STATUS: BUYERS RECLAIMING
MOMENTUM: Reversal (V-Shape)
INFLECTION: 88.00 (Psychological Support)
NEXT 30s: Squeeze to 88.40
ACTION: LONG BIAS - Chase the reclaim, shorts are trapped`,
    fullResponse: `> FULL TAPE REVIEW
----------------------------------------
1. STRUCTURE
- Failed breakdown below 88.00
- Aggressive bid whack at 87.90 (absorption)
- Sellers exhausted, asks lifting fast

2. ORDER FLOW
- Rapid green prints on T&S (panic covers)
- 88.00 offer flipped to bid instantly
- Speed of tape increased 3x on the reversal

3. SCENARIO
- Short squeeze in progress
- Trapped shorts from 87.90 break need to cover
- Expect fast move to VWAP

> ACTIONABLE SETUP
Long now (88.05). Stop 87.90. Target 88.50.`
  },
  {
    id: "distribution",
    title: "Top Distribution",
    description: "Heavy volume at highs but price stalling. Hidden sellers.",
    imagePrompt: "Level 2 market data showing distribution. High volume bars but price flatlining at top. Red asks refreshing constantly. Time and sales mixed.",
    tldrResponse: `> TL;DR ANALYSIS
STATUS: SELLERS IN CONTROL (HIDDEN)
MOMENTUM: Stalling / Churning
INFLECTION: 210.50 (Ceiling)
NEXT 30s: Rollover to 210.20
ACTION: CAUTION / SHORT - Do not buy the breakout`,
    fullResponse: `> FULL TAPE REVIEW
----------------------------------------
1. STRUCTURE
- Double top formation on L2
- 210.50 offer keeps reloading (iceberg seller)
- Buyers lifting but price not moving (churn)

2. ORDER FLOW
- Heavy green prints but zero price appreciation
- Absorption by smart money on the ask
- Bids are thinning out below

3. SCENARIO
- Classic distribution before the dump
- Buyers are being exhausted
- Once 210.40 bid pulls, flush is instant

> ACTIONABLE SETUP
Short 210.35 break. Stop 210.55. Target 209.80.`
  },
  {
    id: "choppy",
    title: "Mid-Day Chop",
    description: "Low volume, spread widening, no clear direction.",
    imagePrompt: "Level 2 market data showing choppy market. Wide spread between bid and ask. Low volume. Mixed colors on time and sales. Boring market.",
    tldrResponse: `> TL;DR ANALYSIS
STATUS: NEUTRAL / NO CONTROL
MOMENTUM: Dead / Choppy
INFLECTION: None valid
NEXT 30s: Rangebound 45.20-45.40
ACTION: WAIT - No edge here. Sit on hands.`,
    fullResponse: `> FULL TAPE REVIEW
----------------------------------------
1. STRUCTURE
- Wide spread (10c+)
- Thin liquidity on both sides
- No clear walls or stepping

2. ORDER FLOW
- T&S is slow, single lot prints
- Algo ping-pong between spread
- No aggression from either side

3. SCENARIO
- Theta burn / Chop fest
- Any move likely false breakout/breakdown
- Wait for volume or distinct level interaction

> ACTIONABLE SETUP
None. Preservation of capital mode.`
  }
];
