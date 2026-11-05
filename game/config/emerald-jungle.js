const platform = (id, x, top, width, kind = "ledge") => Object.freeze({ id, x, top, width, kind });

export const EMERALD_JUNGLE_MOTION = Object.freeze({
  gravity: 1_500,
  jumpVelocity: 680,
  moveSpeed: 320,
  groundAcceleration: 1_900,
  airAcceleration: 1_150,
  groundDrag: 1_750,
  coyoteTimeMs: 110,
  jumpBufferMs: 130,
});

export const EMERALD_JUNGLE_LEVEL = Object.freeze({
  width: 5_200, height: 720,
  art: Object.freeze({
    panorama: "emerald-jungle-panorama.png",
    objects: "jungle-objects-atlas.png",
    terrain: "jungle-terrain-atlas.png",
    objectFrameSize: 444,
    terrainFrameWidth: 888,
    terrainFrameHeight: 444,
    shade: 0x07382c,
    foregroundTint: 0x5d9670,
  }),
  playerStart: Object.freeze({ x: 150, y: 510 }), checkpoint: Object.freeze({ x: 5_045, y: 520 }),
  motion: EMERALD_JUNGLE_MOTION,
  platforms: Object.freeze([
    platform("ground-1",400,640,800,"ground"), platform("ground-2",1_210,640,660,"ground"),
    platform("ground-3",1_990,640,720,"ground"), platform("ground-4",2_790,640,700,"ground"),
    platform("ground-5",3_590,640,720,"ground"), platform("ground-6",4_690,640,1_300,"ground"),
    platform("ledge-1",610,505,250), platform("ledge-2",905,390,220,"step"),
    platform("ledge-3",1_260,500,240), platform("ledge-4",1_650,445,250),
    platform("ledge-5",2_010,370,230,"step"), platform("ledge-6",2_365,500,260),
    platform("ledge-7",2_760,415,245), platform("ledge-8",3_125,505,250),
    platform("ledge-9",3_485,385,230,"step"), platform("ledge-10",3_845,495,260),
    platform("ledge-11",4_215,405,240), platform("ledge-12",4_570,505,250),
  ]),
  mandatoryRoute: Object.freeze(["ground-1","ground-2","ground-3","ground-4","ground-5","ground-6"]),
  coins: Object.freeze([
    [300,575],[480,575],[560,440],[650,440],[860,325],[950,325],[1_130,575],[1_230,435],
    [1_610,380],[1_710,380],[1_970,305],[2_050,305],[2_320,435],[2_410,435],
    [2_720,350],[2_810,350],[3_080,440],[3_170,440],[3_445,320],[3_525,320],
    [3_805,430],[3_895,430],[4_175,340],[4_255,340],[4_525,440],[4_615,440],[4_860,575],[5_010,575],
  ].map(([x,y], index) => Object.freeze({ id: `coin-${index + 1}`, x, y }))),
  fishPowerUps: Object.freeze([Object.freeze({ id:"fish-1", x:540, y:565 })]),
  enemies: Object.freeze([
    Object.freeze({ id:"critter-1",x:740,y:570,left:650,right:780,speed:54 }),
    Object.freeze({ id:"critter-2",x:2_620,y:570,left:2_500,right:3_020,speed:84 }),
    Object.freeze({ id:"critter-3",x:3_710,y:570,left:3_390,right:3_900,speed:92 }),
    Object.freeze({ id:"critter-4",x:4_650,y:570,left:4_480,right:4_900,speed:98 }),
  ]),
  hazards: Object.freeze([
    Object.freeze({ x:1_345,top:588,width:88 }), Object.freeze({ x:2_900,top:588,width:96 }), Object.freeze({ x:4_735,top:588,width:82 }),
  ]),
});
