const platform = (x, y, width, height = 48) => Object.freeze({ x, y, width, height });
export const EMERALD_JUNGLE_LEVEL = Object.freeze({
  width: 5_200, height: 720,
  playerStart: Object.freeze({ x: 140, y: 520 }), checkpoint: Object.freeze({ x: 5_020, y: 548 }),
  platforms: Object.freeze([
    platform(400, 682, 800, 100), platform(1_265, 682, 670, 100), platform(2_095, 682, 710, 100),
    platform(2_975, 682, 750, 100), platform(3_850, 682, 700, 100), platform(4_775, 682, 850, 100),
    platform(650, 520, 230, 34), platform(1_080, 470, 210, 34), platform(1_465, 555, 180, 34),
    platform(1_920, 475, 250, 34), platform(2_360, 390, 180, 34), platform(2_720, 520, 230, 34),
    platform(3_165, 450, 230, 34), platform(3_610, 540, 180, 34), platform(4_030, 435, 240, 34), platform(4_460, 520, 220, 34),
  ]),
  coins: Object.freeze([
    [320,590],[470,590],[610,455],[690,455],[1000,405],[1080,405],[1280,590],[1450,490],
    [1900,410],[2000,410],[2320,325],[2390,325],[2690,455],[2790,455],[3120,385],[3220,385],
    [3560,475],[3830,590],[4000,370],[4100,370],[4430,455],[4520,455],[4790,590],[4930,590],
  ].map(([x,y], index) => Object.freeze({ id: `coin-${index + 1}`, x, y }))),
  enemies: Object.freeze([
    Object.freeze({ id:"critter-1",x:1230,y:590,left:980,right:1520,speed:70 }),
    Object.freeze({ id:"critter-2",x:2840,y:590,left:2680,right:3250,speed:82 }),
    Object.freeze({ id:"critter-3",x:3890,y:590,left:3600,right:4140,speed:88 }),
    Object.freeze({ id:"critter-4",x:4620,y:590,left:4480,right:4920,speed:96 }),
  ]),
  hazards: Object.freeze([
    Object.freeze({ x:1365,y:615,width:82 }), Object.freeze({ x:3040,y:615,width:92 }), Object.freeze({ x:4690,y:615,width:72 }),
  ]),
});
