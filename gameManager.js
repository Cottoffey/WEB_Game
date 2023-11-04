import {Player, Enemy, FireBall, Hp, Damage, Score} from "./objectManager.js"
import spriteManager from "./spriteManager.js";
import * as map from "./mapManager.js";
import eventsManager from "./eventsManager.js";

var gameManager = {
    ctx: null,
    factory: {},
    entities: [],
    fireNum: 0,
    player: null,
    laterKill: [],
    initPlayer: function (obj) {
        this.player = obj;
    },
    kill: function (obj) {
        this.laterKill.push (obj)
    },
    update: function () {
        if (this.player === null)
            return;
        this.player.move_x = 0;
        this.player.move_y = 0;
        if (eventsManager.action["up"]) this.player.move_y = -1;
        if (eventsManager.action["down"]) this.player.move_y = 1;
        if (eventsManager.action["right"]) this.player.move_x = 1;
        if (eventsManager.action["left"]) this.player.move_x = -1;
        if (eventsManager.action["fire"]) this.player.fire();
        this.entities.forEach (function (e) {
            try {
                e.update()
            } catch(ex) {}
        })

        for (let i = 0; i < this.laterKill.length; i++) {
            let idx = this.entities.indexOf (this.laterKill[i]);
            if (idx > -1)
                this.entities.splice (idx, 1);
        }
        if (this.laterKill.length > 0)
            this.laterKill.length = 0;
        mapManager.draw(this.ctx);
        mapManager.centerAt (this.player.pos_x, this.player.pos_y);
        this.draw(this.ctx);
        
    },
    draw: function(ctx) {
        for (let e = 0; e < this.entities.length; e++)
            this.entities[e].draw (ctx)
    },
    loadAll: function() {
        mapManager.loadMap ("./Level_1.json")
        spriteManager.loadAtlas ("./atlas.json", "./Images/sprite.png")
        gameManager.factory["Player"] = Player;
        gameManager.factory["Enemy"] = Enemy;
        gameManager.factory["Hp"] = Hp;
        gameManager.factory["Damage"] = Damage;
        gameManager.factory["FireBall"] = FireBall
        gameManager.factory["Score"] = Score;
        mapManager.parseEntities();
        mapManager.draw(ctx);
        eventsManager.setup (canvas);
    },
    updateWorld: function () {
        gameManager.update();
    },
    play: function() {
        setInterval (this.updateWorld, 200);
    }
}
let canvas = document.getElementById ("field");
let ctx = canvas.getContext ("2d");
ctx.imageSmoothingEnabled = false;
ctx.scale (2,2);
// setInterval (() => {
//     mapManager.draw (ctx);
// }, 500)

var mapManager = Object.create (map);

gameManager.ctx = ctx;
gameManager.loadAll();
gameManager.play();