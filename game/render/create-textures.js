function addHunterTexture(scene, key, pose) {
  const g = scene.add.graphics();
  g.fillStyle(0x173f34).fillRoundedRect(10,24,28,30,8);
  g.fillStyle(0x7a3f22).fillRoundedRect(6,27,9,23,4);
  g.fillStyle(0xf2b56f).fillCircle(25,19,11);
  g.fillStyle(0x153c32).fillEllipse(25,12,31,11).fillRoundedRect(14,2,23,12,6);
  g.fillStyle(0xf1c35b).fillRect(14,11,23,3);
  g.fillStyle(0x17221d).fillCircle(29,18,2); g.fillStyle(0xf4e4c0).fillCircle(23,18,2);
  const leg = pose === 1 ? 5 : pose === 2 ? -5 : 0;
  g.lineStyle(5,0x7a4328).lineBetween(19,50,17-leg,61).lineBetween(31,50,31+leg,61);
  const arm = pose === 1 ? 3 : pose === 2 ? -3 : 0;
  g.lineStyle(4,0xefd2a0).lineBetween(12,31,6,42+arm).lineBetween(38,31,42,42-arm);
  g.fillStyle(0x3b241b).fillRoundedRect(7-leg,58,14,6,3).fillRoundedRect(27+leg,58,14,6,3);
  g.generateTexture(key,48,66); g.destroy();
}
function addCritterTexture(scene,key,step) {
  const g=scene.add.graphics(); g.fillStyle(0x6e3d28).fillEllipse(24,23,40,25);
  g.fillStyle(0xa8663a).fillCircle(37,18,12); g.fillStyle(0xffe4a7).fillCircle(40,15,3);
  g.fillStyle(0x182019).fillCircle(41,15,1.5); g.fillStyle(0x4c2a1f).fillTriangle(31,9,35,0,40,10);
  g.lineStyle(5,0x3b261e).lineBetween(14,31,12+step,38).lineBetween(31,31,32-step,38);
  g.generateTexture(key,50,40); g.destroy();
}
function addBackgroundTextures(scene) {
  let g=scene.add.graphics(); g.fillGradientStyle(0x79d7cf,0x79d7cf,0xd7f0b5,0xd7f0b5,1).fillRect(0,0,640,720);
  g.fillStyle(0xffe29a,.65).fillCircle(510,120,72); g.generateTexture("jungle-sky",640,720); g.destroy();
  g=scene.add.graphics(); g.fillStyle(0x3f8565,.8); for(let x=-100;x<760;x+=170)g.fillTriangle(x,530,x+120,210,x+260,530);
  g.fillStyle(0x236046,.9); for(let x=-80;x<760;x+=135)g.fillTriangle(x,620,x+100,310,x+210,620);
  g.generateTexture("jungle-mountains",640,720); g.destroy();
  g=scene.add.graphics(); g.fillStyle(0x0d4b36,.92); for(let x=10;x<640;x+=100){g.fillRoundedRect(x,280+(x%150),24,410,10);g.fillCircle(x+10,280+(x%150),70);g.fillCircle(x+60,330+(x%100),58);}
  g.generateTexture("jungle-canopy",640,720); g.destroy();
  g=scene.add.graphics(); g.fillStyle(0xd7ffcf,.1).fillEllipse(170,470,360,90).fillEllipse(500,390,420,75).fillEllipse(340,610,520,65);
  g.generateTexture("jungle-mist",640,720); g.destroy();
}
export function createGameTextures(scene) {
  if(scene.textures.exists("hunter-idle-1")) return;
  addHunterTexture(scene,"hunter-idle-1",0); addHunterTexture(scene,"hunter-idle-2",3);
  addHunterTexture(scene,"hunter-run-1",1); addHunterTexture(scene,"hunter-run-2",2); addHunterTexture(scene,"hunter-jump",0);
  addCritterTexture(scene,"critter-1",0); addCritterTexture(scene,"critter-2",3);
  let g=scene.add.graphics(); g.fillStyle(0x4d2c1e).fillRect(0,10,128,38); g.fillStyle(0x28633f).fillRoundedRect(0,0,128,18,7);
  g.fillStyle(0x4b9a5f).fillCircle(18,5,12).fillCircle(76,7,13).fillCircle(112,4,10); g.lineStyle(2,0x82ca72,.6).lineBetween(0,16,128,16);
  g.generateTexture("jungle-platform",128,48); g.destroy();
  g=scene.add.graphics(); g.fillStyle(0xffc52f).fillCircle(14,14,11); g.lineStyle(3,0xffef8b).strokeCircle(14,14,8); g.fillStyle(0xfff4b7).fillRect(12,7,4,14); g.generateTexture("gold-coin",28,28); g.destroy();
  g=scene.add.graphics(); g.fillStyle(0x53382b); for(let x=0;x<96;x+=24)g.fillTriangle(x,42,x+12,2,x+24,42); g.fillStyle(0xd9ad65).fillRect(0,38,96,4); g.generateTexture("jungle-spikes",96,42); g.destroy();
  g=scene.add.graphics(); g.fillStyle(0x5b321f).fillRoundedRect(32,20,16,96,6); g.fillStyle(0xe6b83f).fillCircle(40,24,20); g.fillStyle(0x1d6c4c).fillCircle(40,24,13); g.lineStyle(5,0xfbe69d).strokeCircle(40,24,16); g.fillStyle(0xf5dd82).fillTriangle(12,50,68,38,68,74); g.generateTexture("jungle-checkpoint",80,120); g.destroy();
  addBackgroundTextures(scene);
  scene.anims.create({key:"hunter-idle",frames:[{key:"hunter-idle-1"},{key:"hunter-idle-2"}],frameRate:2,repeat:-1});
  scene.anims.create({key:"hunter-run",frames:[{key:"hunter-run-1"},{key:"hunter-run-2"}],frameRate:9,repeat:-1});
  scene.anims.create({key:"critter-walk",frames:[{key:"critter-1"},{key:"critter-2"}],frameRate:4,repeat:-1});
}
