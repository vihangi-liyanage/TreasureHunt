import * as Phaser from "phaser";
import { GAME_COMMANDS, GAME_EVENTS } from "@/game/core/events";
import { RunState } from "@/game/core/run-state";
import { RUN_RULES } from "@/game/config/worlds";
import { createGameTextures } from "@/game/render/create-textures";
import { PlayerController } from "@/game/systems/player-controller";
import { EnemySystem } from "@/game/systems/enemy-system";

export class WorldScene extends Phaser.Scene {
  constructor(){super("WorldScene");}
  init({world,level,bridge}){this.worldConfig=world;this.level=level;this.bridge=bridge;this.commandCleanups=[];this.isPaused=false;this.safePosition={...level.playerStart};}
  create(){
    createGameTextures(this); this.run=new RunState({lives:RUN_RULES.startingLives,timerSeconds:this.worldConfig.timerSeconds});
    this.physics.world.setBounds(0,0,this.level.width,this.level.height+220); this.cameras.main.setBounds(0,0,this.level.width,this.level.height);
    this.createParallaxBackground(); this.createLevelGeometry(); this.createPlayer(); this.createCollectibles(); this.createEnemies(); this.createCheckpoint(); this.registerCollisions(); this.registerCommands();
    this.timerEvent=this.time.addEvent({delay:1000,loop:true,callback:()=>{if(!this.run.tick())return;this.publishState();if(this.run.status==="game-over")this.finishRun("timer");}});
    this.cameras.main.startFollow(this.player,true,.09,.09).setDeadzone(260,120).fadeIn(350,8,35,28);
    this.bridge.emit(GAME_EVENTS.READY,{worldId:this.worldConfig.id}); this.publishState();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,this.cleanup,this);
  }
  createParallaxBackground(){const w=1280,h=720;this.parallax=[
    {factor:0,sprite:this.add.tileSprite(0,0,w,h,"jungle-sky").setOrigin(0).setScrollFactor(0).setDepth(-50)},
    {factor:.12,sprite:this.add.tileSprite(0,0,w,h,"jungle-mountains").setOrigin(0).setScrollFactor(0).setDepth(-40)},
    {factor:.28,sprite:this.add.tileSprite(0,0,w,h,"jungle-canopy").setOrigin(0).setScrollFactor(0).setDepth(-30)},
    {factor:.45,sprite:this.add.tileSprite(0,0,w,h,"jungle-mist").setOrigin(0).setScrollFactor(0).setDepth(-20)},
  ];}
  createLevelGeometry(){
    this.platforms=this.physics.add.staticGroup(); for(const d of this.level.platforms){const p=this.platforms.create(d.x,d.y,"jungle-platform");p.setDisplaySize(d.width,d.height).refreshBody();}
    this.hazards=this.physics.add.staticGroup(); for(const d of this.level.hazards){const h=this.hazards.create(d.x,d.y,"jungle-spikes");h.setDisplaySize(d.width,42).refreshBody();h.body.setSize(d.width*.82,25).setOffset(d.width*.09,12);}
    for(let x=240;x<this.level.width;x+=460){const v=this.add.graphics().setDepth(-10);v.lineStyle(5,0x174b32,.75).lineBetween(x,0,x+25,150+(x%130));v.fillStyle(0x4a9a58,.75).fillEllipse(x+19,90,32,15);}
  }
  createPlayer(){this.player=this.physics.add.sprite(this.level.playerStart.x,this.level.playerStart.y,"hunter-idle-1");this.player.setDepth(8).setCollideWorldBounds(false).setSize(29,56).setOffset(10,8).setDragX(1450);this.playerController=new PlayerController(this,this.player,this.bridge);}
  createCollectibles(){this.coins=this.physics.add.group({allowGravity:false,immovable:true});for(const d of this.level.coins){const coin=this.coins.create(d.x,d.y,"gold-coin");coin.setData("coinId",d.id).setDepth(4).setCircle(11,3,3);this.tweens.add({targets:coin,y:d.y-8,duration:850+(d.x%300),yoyo:true,repeat:-1,ease:"Sine.inOut"});}}
  createEnemies(){this.enemySystem=new EnemySystem(this,this.level.enemies,this.platforms);}
  createCheckpoint(){const{x,y}=this.level.checkpoint;this.checkpoint=this.physics.add.staticImage(x,y,"jungle-checkpoint").setDepth(3);this.checkpoint.body.setSize(54,110).setOffset(13,5);this.add.text(x-84,y-112,"JUNGLE GATE",{fontFamily:"Arial, sans-serif",fontSize:"18px",fontStyle:"bold",color:"#fff2b5",stroke:"#15362a",strokeThickness:5}).setDepth(3);}
  registerCollisions(){this.physics.add.collider(this.player,this.platforms);this.physics.add.overlap(this.player,this.coins,(_p,c)=>this.collectCoin(c));this.physics.add.overlap(this.player,this.hazards,()=>this.damagePlayer("hazard"));this.physics.add.overlap(this.player,this.enemySystem.group,(_p,e)=>this.touchEnemy(e));this.physics.add.overlap(this.player,this.checkpoint,()=>this.completeWorld());}
  registerCommands(){this.commandCleanups.push(this.bridge.on(GAME_COMMANDS.PAUSE,()=>this.setPaused(true)),this.bridge.on(GAME_COMMANDS.RESUME,()=>this.setPaused(false)),this.bridge.on(GAME_COMMANDS.RESTART,()=>this.scene.restart({world:this.worldConfig,level:this.level,bridge:this.bridge})));this.escapeHandler=()=>this.setPaused(!this.isPaused);this.input.keyboard.on("keydown-ESC",this.escapeHandler);}
  update(){const sx=this.cameras.main.scrollX;for(const layer of this.parallax)layer.sprite.tilePositionX=sx*layer.factor;if(this.isPaused||this.run.status!=="playing")return;this.playerController.update();this.enemySystem.update();this.player.x=Phaser.Math.Clamp(this.player.x,18,this.level.width-18);if(this.player.y>this.level.height+80)this.damagePlayer("fall");}
  collectCoin(coin){const id=coin.getData("coinId");if(!this.run.collectCoin(id))return;const burst=this.add.circle(coin.x,coin.y,8,0xffe77d,.9).setDepth(12);this.tweens.add({targets:burst,scale:3.2,alpha:0,duration:260,onComplete:()=>burst.destroy()});coin.disableBody(true,true);this.bridge.emit(GAME_EVENTS.COIN_COLLECTED,{id,score:this.run.score,coins:this.run.coins});this.publishState();}
  touchEnemy(enemy){if(!enemy.active||this.run.status!=="playing")return;const stomped=this.player.body.velocity.y>120&&this.player.body.bottom<enemy.body.center.y+12;if(stomped){const id=enemy.getData("id");if(this.run.stompEnemy(id)){this.enemySystem.stomp(enemy);this.player.setVelocityY(-360);this.cameras.main.shake(80,.0025);this.bridge.emit(GAME_EVENTS.ENEMY_STOMPED,{id,score:this.run.score});this.publishState();}return;}this.damagePlayer("enemy");}
  damagePlayer(cause){if(this.run.status!=="playing")return;const damaged=this.run.damage(this.time.now);if(!damaged&&cause!=="fall")return;this.cameras.main.shake(170,.007);this.player.setTint(0xff8d72).setVelocity(0,-260);this.time.delayedCall(220,()=>this.player?.active&&this.player.clearTint());this.bridge.emit(GAME_EVENTS.PLAYER_DAMAGED,{cause,lives:this.run.lives});this.publishState();if(this.run.status==="game-over"){this.finishRun("lives");return;}this.player.setPosition(this.safePosition.x,this.safePosition.y).setVelocity(0,0);}
  completeWorld(){if(!this.run.complete())return;this.physics.pause();this.timerEvent.paused=true;this.cameras.main.flash(500,255,225,116);const result={...this.run.snapshot(),worldId:this.worldConfig.id};this.publishState();this.bridge.emit(GAME_EVENTS.WORLD_COMPLETED,result);}
  finishRun(reason){this.physics.pause();this.timerEvent.paused=true;this.publishState();this.bridge.emit(GAME_EVENTS.RUN_ENDED,{...this.run.snapshot(),reason});}
  setPaused(paused){if(this.run.status!=="playing"||this.isPaused===paused)return;this.isPaused=paused;if(paused)this.physics.pause();else this.physics.resume();this.timerEvent.paused=paused;this.publishState();}
  publishState(){this.bridge.emit(GAME_EVENTS.STATE_CHANGED,{...this.run.snapshot(),paused:this.isPaused,worldId:this.worldConfig.id,worldName:this.worldConfig.name});}
  cleanup(){this.playerController?.destroy();for(const cleanup of this.commandCleanups)cleanup();this.input.keyboard.off("keydown-ESC",this.escapeHandler);}
}
