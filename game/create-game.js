import * as Phaser from "phaser";
import { WorldScene } from "@/game/scenes/world-scene";
export function createTreasureHuntGame(parent,{world,level,bridge}){
  const game=new Phaser.Game({type:Phaser.AUTO,parent,width:1280,height:720,backgroundColor:"#0b3026",antialias:true,render:{roundPixels:false},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:1280,height:720},physics:{default:"arcade",arcade:{gravity:{y:1600},debug:false}},scene:[]});
  game.scene.add("WorldScene",WorldScene,true,{world,level,bridge}); return game;
}
