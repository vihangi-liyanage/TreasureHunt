import * as Phaser from "phaser";
import { WorldScene } from "@/game/scenes/world-scene";
export function createTreasureHuntGame(parent,{world,level,bridge,assetUrls,startPaused=false}){
  const game=new Phaser.Game({type:Phaser.AUTO,parent,width:parent.clientWidth||1280,height:parent.clientHeight||720,backgroundColor:"#0b3026",transparent:false,antialias:true,render:{roundPixels:false,pixelArt:false},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.NO_CENTER},physics:{default:"arcade",arcade:{gravity:{y:level.motion.gravity},debug:false}},scene:[]});
  game.scene.add("WorldScene",WorldScene,true,{world,level,bridge,assetUrls,startPaused}); return game;
}
