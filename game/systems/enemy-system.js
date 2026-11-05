export class EnemySystem {
  constructor(scene,definitions,platforms){
    this.group=scene.physics.add.group({allowGravity:true});
    for(const d of definitions){const enemy=this.group.create(d.x,d.y,"critter-1");enemy.setData({...d,direction:1}).setVelocityX(d.speed).setSize(38,27).setOffset(6,10);enemy.play("critter-walk");}
    scene.physics.add.collider(this.group,platforms);
  }
  update(){for(const enemy of this.group.getChildren()){if(!enemy.active)continue;const d=enemy.data.values;if(enemy.x<=d.left)d.direction=1;if(enemy.x>=d.right)d.direction=-1;enemy.setVelocityX(d.speed*d.direction).setFlipX(d.direction<0);}}
  stomp(enemy){enemy.disableBody(true,true);}
}
