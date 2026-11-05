import * as Phaser from "phaser";
import { GAME_COMMANDS } from "@/game/core/events";
const MOVE_SPEED=285, MOVE_ACCELERATION=1650, JUMP_SPEED=610;
export class PlayerController {
  constructor(scene,player,bridge){
    this.scene=scene; this.player=player; this.virtual={left:false,right:false}; this.jumpQueued=false;
    this.keys=scene.input.keyboard.addKeys({left:Phaser.Input.Keyboard.KeyCodes.LEFT,right:Phaser.Input.Keyboard.KeyCodes.RIGHT,a:Phaser.Input.Keyboard.KeyCodes.A,d:Phaser.Input.Keyboard.KeyCodes.D,up:Phaser.Input.Keyboard.KeyCodes.UP,space:Phaser.Input.Keyboard.KeyCodes.SPACE});
    this.unsubscribe=bridge.on(GAME_COMMANDS.INPUT,({control,pressed})=>{if(control==="jump"&&pressed)this.jumpQueued=true;if(control==="left"||control==="right")this.virtual[control]=Boolean(pressed);});
  }
  update(){
    const body=this.player.body, left=this.keys.left.isDown||this.keys.a.isDown||this.virtual.left, right=this.keys.right.isDown||this.keys.d.isDown||this.virtual.right;
    const jump=Phaser.Input.Keyboard.JustDown(this.keys.up)||Phaser.Input.Keyboard.JustDown(this.keys.space)||this.jumpQueued; this.jumpQueued=false;
    if(left===right)this.player.setAccelerationX(0).setDragX(1450);else{const d=left?-1:1;this.player.setAccelerationX(d*MOVE_ACCELERATION).setDragX(0).setFlipX(d<0);}
    this.player.setMaxVelocity(MOVE_SPEED,900); if(jump&&body.blocked.down)this.player.setVelocityY(-JUMP_SPEED);
    if(!body.blocked.down)this.player.anims.stop().setTexture("hunter-jump");else if(Math.abs(body.velocity.x)>28)this.player.play("hunter-run",true);else this.player.play("hunter-idle",true);
  }
  destroy(){this.unsubscribe?.();}
}
