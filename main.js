var Entity = {
    pos_x: 0,
    pos_y: 0,
    size_x: 14,
    size_y: 14,
    reverse: false,
    counter: 0,
    kill: function() {
        gameManager.laterKill.push(this)
    },
    extend: function (extendProto) {
        var object = Object.create(this);
        for (let property in extendProto) {
            if (this.hasOwnProperty(property) || typeof object[property] === 'undefined')
                object[property] = extendProto[property];
        }
        return object;
    }
}

var Player = Entity.extend ({
    lifetime:100,
    score: 0,
    baseCooldown: 30,
    cooldown: 0,
    damage: 20,
    move_x: 0,
    move_y: 0,
    dir_x: 1,
    dir_y: 0,
    speed: 16,
    draw: function (ctx) {
        spriteManager.drawSprite (ctx, `Player${Math.floor (this.counter / 9) + 1}`, this.pos_x - 8, this.pos_y - 8, this.reverse)
        if (this.counter + 1 > 35)
            this.counter = 0;
        else 
            this.counter++;

        if (this.cooldown > 0)
            this.cooldown--;
    },
    update: function (ctx) {
        physicManager.update (this)
    },
    onTouchEntity: function (obj) {
        if (obj.name == "DoorLevel_2") {
            console.log ("Dooor")
            gameManager.newlevel = "./Level_2.json"
        }
        else if (obj.name == "DoorFinish") {
            gameManager.stopGame();
        }
        else if (obj.type.match ("Score")) {
            this.score += obj.value;
            soundManager.play ("./Sounds/04_sack_open_3.wav")
            obj.kill();
        }
        else if (obj.type.match ("Damage")) {
            this.baseCooldown -= obj.value;
            soundManager.play ("./Sounds/04_sack_open_3.wav")
            obj.kill();
        } 
        else if (obj.type.match ("Hp")) {
            this.lifetime += obj.value;
            soundManager.play ("./Sounds/04_sack_open_3.wav")
            obj.kill();
        }
    },
    fire: function (dx,dy) {
        if (this.cooldown > 0)
            return;
        this.cooldown = this.baseCooldown;
        var b = Object.create (FireBall)
        b.type = "FireBall"
        b.name = "Fireball" + (++gameManager.fireNum);
        b.id = gameManager.fireNum;
        b.move_x = dx;
        b.move_y = dy;
        if (dx < 0)
            b.reverse = true;
        b.pos_x = this.pos_x + (this.size_x) * dx;
        b.pos_y = this.pos_y + (this.size_y) * dy;
        b.draw(gameManager.ctx);
        gameManager.entities.push(b);
        soundManager.play ("./Sounds/Fireball.mp3", {volume: 0.5})
    },
})

var Enemy = Entity.extend( {
    lifetime: 60,
    baseCooldown: 30,
    cooldown: 0,
    map: [],
    path: [],
    break: 0,
    move_x: 0,
    move_y: 0,
    speed: 16,
    draw: function (ctx) {
        spriteManager.drawSprite (ctx, `Enemy${Math.floor (this.counter / 9) + 1}`, this.pos_x - 8, this.pos_y- 8, this.reverse)
        // if need visualization
        // for (let i = 0; i < mapManager.yCount; i++) {
        //     for (let j = 0; j < mapManager.xCount; j++) {
        //         if (this.map[i * mapManager.xCount + j] == -1)
        //             spriteManager.drawSprite (ctx, "Coin1", j * 16, i * 16)
        //     }
        // }
        if (this.counter + 1 > 35)
            this.counter = 0;
        else 
            this.counter++;
    },
    checkVisible: function () {
        let x = gameManager.player.pos_x
        let y = gameManager.player.pos_y
        let x0 = this.pos_x;
        let y0 = this.pos_y;
        let dx = x - x0;
        let dy = y - y0;
        if (Math.sqrt (dx * dx + dy * dy) > 96)
            return false;
        if (Math.abs(dx) > Math.abs (dy)) {
            var stepx = dx > 0 ? 16 : -16;
            var stepy = dy / Math.abs(dx / 16);
        } else {
            var stepy = dy > 0 ? 16 : -16;
            var stepx = dx / Math.abs(dy / 16);
        }
        do {
            x0 += stepx;
            y0 += stepy;
            var ts = mapManager.getTilesetIdx (x0, y0)
            if (!(ts == 12 || ts == 13 || ts == 15 || ts == 17 || ts == 22 || ts == 23 || ts == 24 || ts == 33 || ts == 32 || ts == 35 || ts == 25))
                return false;
        } while (x != Math.round(x0) || y != Math.round(y0))

        return true;
    },
    wave: function (x, y, d) {
        if (x + 1 < mapManager.xCount && this.map[y * mapManager.xCount + x + 1] == 0)
            this.map[y * mapManager.xCount + x + 1] = d + 1
        if (x - 1 >= 0 && this.map[y * mapManager.xCount + x - 1] == 0)
            this.map[y * mapManager.xCount + x - 1] = d + 1
        if (y + 1 < mapManager.yCount && this.map[(y + 1) * mapManager.xCount + x] == 0)
            this.map[(y + 1) * mapManager.xCount + x] = d + 1
        if (y - 1 >= 0 && this.map[(y - 1) * mapManager.xCount + x] == 0)
            this.map[(y - 1) * mapManager.xCount + x] = d + 1
    },
    buildPath: function (x,y) {
        this.map = []
        for (let i = 0; i < mapManager.binaryMap.length; i++)
            this.map.push (mapManager.binaryMap[i])
        let h = mapManager.xCount
        this.map[(this.pos_y - 8) * h / 16 + (this.pos_x - 8) / 16] = 1;
        let d = 1;
        let flag = false;
        let f = true
        loop: while (f) {
            f = false
            for (let i = 0; i < mapManager.yCount; i++) {
                for (let j = 0; j < h; j++) {
                    if (this.map[i * h + j] == d) {
                        if (i == y && j == x) {
                            flag = true 
                            break loop
                        }
                        f = true
                        this.wave (j, i, d)
                    }
                }
            }
            d++;
        }
        this.path = []

        if (flag == false)
            return

        while (y != (this.pos_y - 8) / 16 || x != (this.pos_x - 8) / 16) {
            if (x + 1 < mapManager.xCount && this.map[y * h + x + 1] == d - 1) {
                this.path.push ([-1,0])
                x++;
            }
            else if (x - 1 >= 0 && this.map[y * h + x - 1] == d - 1) {
                this.path.push ([1,0])
                x--;
            } 
            else if (y + 1 < mapManager.yCount && this.map[(y + 1) * h + x] == d - 1) {
                this.path.push ([0,-1])
                y++;
            } 
            else if (y - 1 >= 0 && this.map[(y - 1) * h + x] == d - 1) {
                this.path.push ([0,1])
                y--;
            } 
            d--;
        }
        this.path.reverse();
    },

    update: function (ctx) {
        physicManager.update(this)
        if (this.checkVisible()) {
            // fire 
            let dx = gameManager.player.pos_x - this.pos_x
            let dy = gameManager.player.pos_y - this.pos_y
            if (dx == 0) {
                this.fire (0,  Math.round (dy / Math.abs(dy)))
            } else if (dy == 0)
                this.fire (Math.round (dx / Math.abs(dx)), 0)

            this.buildPath((gameManager.player.pos_x - 8) / 16, (gameManager.player.pos_y - 8) / 16)
            // calc path 
            // this.map = []
            // for (let i = 0; i < mapManager.binaryMap.length; i++)
            //     this.map.push (mapManager.binaryMap[i])
            // let x = (this.pos_x - 8) / 16
            // let y = (this.pos_y - 8) / 16
            // this.map[y * mapManager.xCount + x] = 1;
            // for (let i = 0; i < this.path.length; i++) {
            //     x += this.path[i][0]
            //     y += this.path[i][1]    
            //     this.map[y * mapManager.xCount + x] = 1;
            // }
        }
        if (this.break > 0)
            this.break--
        else if (this.path.length > 0) {
            this.break = 12
            this.move_x = this.path[0][0];
            this.move_y = this.path[0][1];
            if (this.move_x < 0)
                this.reverse = true;
            else if (this.move_x > 0)
                this.reverse = false;
            this.path.splice (0, 1)
        } 
        else if (Math.random() > 0.99) {
            this.break = 12
            let x = (this.pos_x - 8) / 16 + Math.floor(Math.random() * 10) - 5;
            let y = (this.pos_y - 8) / 16 + Math.floor(Math.random() * 10) - 5;
            while (mapManager.binaryMap[y * mapManager.xCount + x] != 0) {
                x = (this.pos_x - 8) / 16 + Math.floor(Math.random() * 10) - 5;
                y = (this.pos_y - 8) / 16 + Math.floor(Math.random() * 10) - 5;
            }
            this.buildPath (x, y);
            // this.map = []
            // for (let i = 0; i < mapManager.binaryMap.length; i++)
            //     this.map.push (mapManager.binaryMap[i])
            // x = (this.pos_x - 8) / 16
            // y = (this.pos_y - 8) / 16
            // this.map[y * mapManager.xCount + x] = 1;
            // for (let i = 0; i < this.path.length; i++) {
            //     x += this.path[i][0]
            //     y += this.path[i][1]    
            //     this.map[y * mapManager.xCount + x] = 1;
            // }
        }
        if (this.cooldown > 0)
            this.cooldown--;
    },
    onTouchEntity: function (obj) {},
    fire: function (dx,dy) {
        if (this.cooldown > 0)
            return;
        this.cooldown = this.baseCooldown;
        var b = Object.create (FireBall)
        b.type = "FireBall"
        b.name = "Fireball" + (++gameManager.fireNum);
        b.id = gameManager.fireNum;
        b.move_x = dx;
        b.move_y = dy;
        if (dx < 0)
            b.reverse = true;
        b.pos_x = this.pos_x + dx * this.size_x;
        b.pos_y = this.pos_y + dy * this.size_y;
        b.draw(gameManager.ctx);
        // b.update()
        gameManager.entities.push(b);
        soundManager.play ("./Sounds/Fireball.mp3", {volume:0.5})
    },
})

var Hp = Entity.extend ( {
    value: 20,
    draw: function (ctx) {
        spriteManager.drawSprite (ctx, `Hp${Math.floor (this.counter / 9) + 1}`, this.pos_x - 8, this.pos_y - 8)
        if (this.counter + 1 > 35)
            this.counter = 0;
        else 
            this.counter++;
    },
})

var Damage = Entity.extend( {
    value: 5,
    draw: function (ctx) {
        spriteManager.drawSprite (ctx, `Damage${Math.floor (this.counter / 9) + 1}`, this.pos_x - 8, this.pos_y - 8)
        if (this.counter + 1 > 35)
            this.counter = 0;
        else 
            this.counter++;
    },
})

var Flag = Entity.extend( {
    draw: function (ctx) {
        spriteManager.drawSprite (ctx, `Flag${Math.floor (this.counter / 9) + 1}`, this.pos_x - 8, this.pos_y - 8)
        if (this.counter + 1 > 35)
            this.counter = 0;
        else 
            this.counter++;
    },
})

var Candlestick = Entity.extend( {
    draw: function (ctx) {
        spriteManager.drawSprite (ctx, `Candlestick${Math.floor (this.counter / 9) + 1}`, this.pos_x - 8, this.pos_y - 8)
        if (this.counter + 1 > 35)
            this.counter = 0;
        else 
            this.counter++;
    },
})

var FireBall = Entity.extend ({
    move_x: 0,
    move_y: 0,
    size_x: 12,
    size_y: 12,
    damage: 20,
    speed: 2,
    draw: function (ctx) {
        spriteManager.drawSprite (ctx, `FireBall${Math.floor (this.counter / 9) + 1}`, this.pos_x - 8, this.pos_y - 8, this.reverse)
        if (this.counter + 1 > 35)
            this.counter = 0;
        else 
            this.counter++;
    },
    update: function (ctx) {
        physicManager.update (this)
    },
    onTouchMap: function (param) { 
        this.kill();
    },
    onTouchEntity: function (obj) {
        if (obj.type == "Enemy" || obj.type == "Player") {
            obj.lifetime -= this.damage;
            console.log(obj.lifetime);
            if (obj.lifetime <= 0) {
                if (obj.type == "Enemy") {
                    soundManager.playWorldSound ("./Sounds/24_orc_death_spin.wav", obj.pos_x, obj.pos_y)
                    gameManager.player.score += 20;
                }
                else if (obj.type == "Player")
                    soundManager.play ("./Sounds/14_human_death_spin.wav")
                obj.kill();
            } else  {
                if (obj.type == 'Player')
                    soundManager.play ("./Sounds/11_human_damage_3.wav")
                else if (obj.type == "Enemy")
                    soundManager.play ("./Sounds/21_orc_damage_1.wav")
            }
            this.kill()
        }
    },
})

var Score = Entity.extend ({
    value: 10,
    draw: function (ctx) {
        spriteManager.drawSprite (ctx, `Coin${Math.floor (this.counter / 9) + 1}`, this.pos_x - 8, this.pos_y - 8)
        if (this.counter + 1 > 35)
            this.counter = 0;
        else 
            this.counter++;
    },
})

var Door = Entity.extend({
    draw: function (ctx) {
        spriteManager.drawSprite (ctx, "Coin1",this.pos_x - 8, this.pos_y - 8)
    },
})

var eventsManager = {
    bind: [],
    action: [],
    setup: function (canvas) {
        this.bind[87] = 'up';
        this.bind[65] = 'left';
        this.bind[83] = 'down';
        this.bind[68] = 'right';
        this.bind[74] = 'fire_left';
        this.bind[73] = 'fire_up';
        this.bind[76] = 'fire_right';
        this.bind[75] = 'fire_down';
        canvas.addEventListener ("mousedown", this.onMouseDown);
        canvas.addEventListener ("mouseup", this.onMouseUp);
        document.body.addEventListener ("keydown", this.onKeyDown);
    },
    onKeyDown: function (event) {
        var action = eventsManager.bind[event.keyCode]
        if (action) {
            eventsManager.action[action] = true
        }
    },
}

var physicManager = {
    update: function (obj) {
        if (obj.move_x == 0 && obj.move_y == 0)
            return "stop"
        if (obj.dir_x != undefined && obj.dir_y != undefined) {
            obj.dir_x = obj.move_x
            obj.dir_y = obj.move_y
        }

        var newx = obj.pos_x + Math.floor (obj.move_x * obj.speed)
        var newy = obj.pos_y + Math.floor (obj.move_y * obj.speed);
        // console.log (newx, newy)
        var ts = mapManager.getTilesetIdx (newx + obj.size_x / 2, newy + obj.size_y / 2)
        // console.log(ts)
        var e = physicManager.entityAtxy (obj, newx, newy);
        // console.log(e)
        if (e !== null && obj.onTouchEntity)
            obj.onTouchEntity(e);
        if (!(ts == 12 || ts == 13 || ts == 15 || ts == 17 || ts == 22 || ts == 23 || ts == 24 || ts == 33 || ts == 32 || ts == 35 || ts == 25) && obj.onTouchMap)
            obj.onTouchMap(ts);
        if ((ts == 12 || ts == 13 || ts == 15 || ts == 17 || ts == 22 || ts == 23 || ts == 24 || ts == 33 || ts == 32 || ts == 35 || ts == 25) && (e == null || obj.type == "FireBall")) {
            obj.pos_x = newx;
            obj.pos_y = newy;
            if (obj.type == "Player")
                soundManager.play (`./Sounds/16_human_walk_stone_${Math.floor (Math.random() * 3) + 1}.wav`)
            else if (obj.type == "Enemy")
                soundManager.playWorldSound (`./Sounds/25_orc_walk_stone_${Math.floor (Math.random() * 3) + 1}.wav`, obj.pos_x, obj.pos_y)
        }
        else 
            return "break"
        
        if (obj.type == "Enemy") {
            obj.move_x = 0;
            obj.move_y = 0;
        }

        return "move";
    },

    entityAtxy: function (obj, x, y) {
        for (let i = 0; i < gameManager.entities.length; i++) {
            let e = gameManager.entities[i];
            if (e.id !== obj.id) {
                if (x + obj.size_x < e.pos_x ||
                    y + obj.size_y < e.pos_y ||
                    y > e.pos_y + e.size_y ||
                    x > e.pos_x + e.size_x)
                    continue;
                return e;
            }
        }
        return null;
    }
}

var spriteManager = {
    image: new Image(),
    sprites: new Array (),
    imgLoaded: false,
    jsonLoaded:false,
    
    loadAtlas: function (atlasJSON, atlasImg) {
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
                spriteManager.parseAtlas(request.responseText);
            }
        }
        request.open ("GET", atlasJSON, true);
        request.send();
        this.loadImg (atlasImg);
    },

    loadImg: function (imgName) {
        this.image.onload = function () {
            spriteManager.imgLoaded = true;
        }
        this.image.src = imgName;
    },

    parseAtlas: function (atlasJSON) {
        let atlas = JSON.parse(atlasJSON);
        for (let name in atlas.frames) {
            let frame = atlas.frames[name].frame;
            this.sprites.push ({name: name, x: frame.x, y: frame.y, w: frame.w, h: frame.h})
        }
        this.jsonLoaded = true;
    },

    drawSprite: function (ctx, name, x, y, reverse = false) {
        if (!this.imgLoaded || !this.jsonLoaded) {
            setTimeout (() => {
                spriteManager.drawSprite (ctx, name, x, y);
            }, 100)
        }
        else {
            let sprite = this.getSprite (name);
            if (!mapManager.isVisible (x, y, sprite.w, sprite.h))
                return;
            x -= mapManager.view.x;
            y -= mapManager.view.y;
            if (reverse) {
                ctx.translate(x + sprite.w,y);
                ctx.scale(-1,1)
                ctx.drawImage (this.image, sprite.x, sprite.y, sprite.w, sprite.h, 0, 0, sprite.w, sprite.h)
                ctx.setTransform(4,0,0,4,0,0);
            }
            else
                ctx.drawImage (this.image, sprite.x, sprite.y, sprite.w, sprite.h, x, y, sprite.w, sprite.h);
        }
    },

    getSprite: function (name) {
        for (let i = 0; i < this.sprites.length; i++) {
            var s = this.sprites[i];
            if (s.name === name)
                return s;
        }
        return null;
    }
}

var mapManager = {
    mapData:null,
    binaryMap: null,
    tLayers: new Array(),
    xCount:0,
    yCount:0,
    tSize: {x:16, y:16},
    mapSize: {x:480, y:320},
    view: {x:0, y:0, w:240, h:240},
    tilesets: new Array(),
    imgLoadCount: 0,
    imgLoaded: false,
    jsonLoaded: false,

    parseMap: function  (tilesJSON) {
        this.mapData = JSON.parse (tilesJSON);
        // this.mapData = tilesJSON;
        this.xCount = this.mapData.width;
        this.yCount = this.mapData.height;
        this.tSize.x = this.mapData.tilewidth;
        this.tSize.y = this.mapData.tileheight;
        this.mapSize.x = this.xCount * this.tSize.x;
        this.mapSize.y = this.yCount * this.tSize.y;
        for (let i = 0; i < this.mapData.tilesets.length; i++) {
            let img = new Image();
            img.onload = function () {
                mapManager.imgLoadCount++;
                if (mapManager.imgLoadCount === mapManager.mapData.tilesets.length) {
                    mapManager.imgLoaded = true
                }
            }
            img.src = this.mapData.tilesets[i].image;
            let t = this.mapData.tilesets[i];
            let ts = {
                firstgid: t.firstgid,
                image: img,
                name: t.name,
                xCount: Math.floor (t.imagewidth / mapManager.tSize.x),
                yCount: Math.floor (t.imageheight / mapManager.tSize.y)
            }
            this.tilesets.push (ts);
    
        }
        this.jsonLoaded = true;
        
        // console.log ("Json finish")
    },
    buildBinaryMap: function () {
        var map = this.tLayers[0].data;
        this.binaryMap = []
        for (let i = 0; i < map.length; i++)
            if (map[i] == 12 || map[i] == 13 || map[i] == 15 || map[i] == 17 || map[i] == 22 || map[i] == 23 || map[i] == 24 || map[i] == 33 || map[i] == 32 || map[i] == 35 || map[i] == 25)
                this.binaryMap[i] = 0
            else 
                this.binaryMap[i] = -1
        for (let i = 0; i < gameManager.entities.length; i++) {
            if (gameManager.entities[i].type == "Candlestick") {
                this.binaryMap[(gameManager.entities[i].pos_y - 8) / 16 *  mapManager.xCount + (gameManager.entities[i].pos_x - 8) / 16] = -1
            }
        }
        // console.log(this.binaryMap)
    },
    loadMap: function  (path) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
                mapManager.parseMap (request.responseText);
            }
        }
        request.open ("GET", path, true);
        request.send();
    },

    draw: function  (ctx) {
        if (!this.imgLoaded || !this.jsonLoaded) {
            setTimeout(function () {
                mapManager.draw (ctx);
            },100)
            // console.log ("False")
        }
        else {
            if (this.tLayers.length == 0) {
                for (let id = 0; id < this.mapData.layers.length; id ++) {
                    let layer = this.mapData.layers[id];
                    if (layer.type === "tilelayer") {
                        this.tLayers.push (layer);
                    }
                }
                this.buildBinaryMap();
                // console.log ("Length == 0")
            }
            ctx.clearRect (0, 0, mapManager.view.w * mapManager.scale, mapManager.view.h * mapManager.scale);
            for (let j = 0; j < this.tLayers.length; j++) {
                for (let i = 0; i < this.tLayers[j].data.length; i++) {
                    if (this.tLayers[j].data[i] !== 0) {
                        let tile = mapManager.getTile (this.tLayers[j].data[i])
                        let px = (i % this.xCount) * this.tSize.x;
                        let py = Math.floor (i / this.xCount) * this.tSize.y;
                        if (!mapManager.isVisible (px, py, this.tSize.x, this.tSize.y))
                            continue;
                        px -= this.view.x;
                        py -= this.view.y;
                        ctx.drawImage (tile.img, tile.px, tile.py, this.tSize.x , this.tSize.y, px , py, this.tSize.x, this.tSize.y);
                    }
                }
            }
        }
        // console.log ("draw finish")

    },

    getTile: function (tileIndex) {
        let tile = {
            img: null,
            px: 0,
            py: 0
        }
        let tileset = this.getTileset (tileIndex);
        tile.img = tileset.image;
        let id = tileIndex - tileset.firstgid;
        let x = id % tileset.xCount;
        let y = Math.floor (id / tileset.xCount);
        tile.px = x * this.tSize.x;
        tile.py = y * this.tSize.y;
        // console.log("GetTile call")
        return tile;
    },

    getTileset: function  (tileIndex) {
        for (let i = this.tilesets.length - 1; i >= 0; i--) {
            if (this.tilesets[i].firstgid <= tileIndex ) {
                return this.tilesets[i];
            }
        }
    
        return null;
    },

    centerAt (x,y) {
        if (x < this.view.w / 2)
            this.view.x += (this.view.w / 2 - this.view.x - this.view.w / 2) / 20
        else if (x >= this.mapSize.x - this.view.w / 2)
            this.view.x += (this.mapSize.x - this.view.w / 2 - this.view.x - this.view.w / 2) / 20
        else
            this.view.x += (x - this.view.x - this.view.w / 2) / 20

        if (y < this.view.h / 2)
            this.view.y += (this.view.h / 2 - this.view.y - this.view.h / 2) / 20
        else if (y >= this.mapSize.y - this.view.h / 2)
            this.view.y += (this.mapSize.y - this.view.h / 2 - this.view.y - this.view.h / 2) / 20
        else 
            this.view.y += (y - this.view.y - this.view.h / 2) / 20
    },

    getTilesetIdx (x,y) {
        let wx = x;
        let wy = y;
        let idx = Math.floor (wy / this.tSize.y ) * this.xCount + Math.floor (wx / this.tSize.x)
        // console.log(idx);
        return this.tLayers[0].data[idx];
    },

    isVisible: function (x, y, width, height) {
        if (x + width < this.view.x || y + height < this.view.y ||
            x > this.view.x + this.view.w || y > this.view.y + this.view.h)
            return false;
        return true;
    },

    parseEntities: function () {
        if (!this.imgLoaded || !this.jsonLoaded) {
            setTimeout (() => {
                mapManager.parseEntities()
            }, 100)
        }
        else {
            for (let i = 0; i < this.mapData.layers.length; i++) {
                if (this.mapData.layers[i].type === "objectgroup") {
                    let entities = this.mapData.layers[i];
                    for (let j = 0; j < entities.objects.length; j++) {
                        let e = entities.objects[j];
                        try {
                            let obj = Object.create (gameManager.factory[e.type])
                            obj.name = e.name;
                            obj.type = e.type
                            obj.id = e.id
                            obj.pos_x = Math.floor (e.x / this.tSize.x ) * this.tSize.x + 8
                            obj.pos_y = Math.floor (e.y / this.tSize.y ) * this.tSize.y + 8
                            // obj.size_x = e.width;
                            // obj.size_y = e.height;
                            if (obj.type === "Player") {
                                if (gameManager.player == null) {
                                    gameManager.initPlayer (obj);
                                    gameManager.entities.push (obj);
                                }
                                else {
                                    gameManager.player.pos_x = obj.pos_x;
                                    gameManager.player.pos_y = obj.pos_y
                                    gameManager.player.id = obj.id 
                                    gameManager.entities.push (gameManager.player);
                                }
                            }
                            else {
                                gameManager.entities.push (obj);
                            }
                        }
                        catch (ex) {
                            console.log("Error while creating: [" + e.gid + "] " + e.type + ", " + ex);
                        }
                    }
                }
                gameManager.isAllLoaded = true;
            }
        }
    },

    changeView: function (dx, dy) {
        if (this.view.x + dx >= 0 && this.view.x + dx + this.view.w < this.mapSize.x)
            this.view.x += dx;
        if (this.view.y + dy >= 0 && this.view.y + dy + this.view.h < this.mapSize.y)
            this.view.y += dy;
    }
}

var soundManager = {
    clips: {},
    context: null,
    loaded: false,
    init: function () {
        this.context = new AudioContext();
    },

    load: function (path, callback) {
        if (this.clips[path]) {
            // callback (this.clips[path]);
            return;
        }
        var clip = {path:path, buffer:null, loaded:false}
        clip.play = function (volume, loop) {
            soundManager.play (this.path, {looping: loop ? loop : false, volume : volume ? volume : 1})
        }
        this.clips[path] = clip;
        var request = new XMLHttpRequest();
        request.open ("GET", path, true);
        request.responseType = "arraybuffer"
        request.onload = function () {
            soundManager.context.decodeAudioData (request.response, function (buffer) {
                clip.buffer = buffer;
                clip.loaded = true;
                callback(clip)
            })
        }
        request.send();
        soundManager.loaded = true;
    },
    loadArray: function (array) {
        for (let i = 0; i < array.length; i++) {
            soundManager.load (array[i], function () {
                if (array.length == Object.keys (soundManager.clips).length) {
                    for (var sd in soundManager.clips)
                        if (!soundManager.clips[sd].loaded)
                            return 
                    soundManager.loaded = true;
                }
            })
        }
    },
    play: function (path, settings) {
        if (!soundManager.loaded) {
            setTimeout(() => {
                soundManager.play (path,settings)
            }, 1000);
            return;
        }

        var looping = false;
        var volume = 1;
        if (settings) {
            if (settings.looping)
                looping = settings.looping
            if (settings.volume)
                volume = settings.volume
        }
        var sd = this.clips[path]
        if (sd == null)
            return false;

        var gainNode = this.context.createGain ? this.context.createGain() : this.context.createGainNode;
        gainNode.connect (this.context.destination)

        var sound = soundManager.context.createBufferSource();
        sound.buffer = sd.buffer;
        sound.connect (gainNode)
        sound.loop = looping
        gainNode.gain.value = volume;
        sound.start(0);
        return true;
    },
    playWorldSound: function (path, x, y) {
        if (gameManager.player == null)
            return;
        var viewSize = Math.max (mapManager.view.w, mapManager.view.h) * 0.8;
        var dx = Math.abs (gameManager.player.pos_x - x)
        var dy = Math.abs (gameManager.player.pos_y - y)
        var distance = Math.sqrt (dx * dx + dy * dy);
        var norm = distance / viewSize;
        if (norm > 1)
            norm = 1;
        var volume = 1.0 - norm;
        if (!volume)
            return
        soundManager.play (path, {looping:false, volume: volume})
    }
}

var gameManager = {
    interval: null,
    ctx: null,
    factory: {},
    entities: [],
    fireNum: 1000,
    isAllLoaded: false,
    player: null,
    newlevel: null,
    laterKill: [],
    initPlayer: function (obj) {
        this.player = obj;
    },
    kill: function (obj) {
        this.laterKill.push (obj)
    },
    update: function () {
        if (this.isAllLoaded == false)
            return;
        this.player.move_x = 0;
        this.player.move_y = 0;
        if (eventsManager.action["up"]) this.player.move_y = -1;
        if (eventsManager.action["down"]) this.player.move_y = 1;
        if (eventsManager.action["right"])  {
            this.player.move_x = 1;
            this.player.reverse = false;
        }
        if (eventsManager.action["left"])  {
            this.player.move_x = -1;
            this.player.reverse = true;
        }
        if (eventsManager.action["fire_left"])  {
            this.player.fire(-1,0);
            this.player.reverse = true
        }
        if (eventsManager.action["fire_up"]) this.player.fire(0,-1);
        if (eventsManager.action["fire_right"]){
            this.player.fire(1,0);
            this.player.reverse = false;
        }
        if (eventsManager.action["fire_down"]) this.player.fire(0,1);
        this.entities.forEach (function (e) {
            try {
                e.update()
            } catch(ex) {}
        })
        eventsManager.action["up"] = false
        eventsManager.action["down"] = false
        eventsManager.action["right"] = false 
        eventsManager.action["left"] = false 
        eventsManager.action["fire_down"] = false
        eventsManager.action["fire_up"] = false
        eventsManager.action["fire_right"] = false
        eventsManager.action["fire_left"] = false

        for (let i = 0; i < this.laterKill.length; i++) {
            let idx = this.entities.indexOf (this.laterKill[i]);
            if (idx > -1)
                this.entities.splice (idx, 1);
        }
        if (this.laterKill.length > 0)
            this.laterKill.length = 0;
        mapManager.centerAt (this.player.pos_x, this.player.pos_y);
        mapManager.draw(this.ctx);
        this.draw(this.ctx);
        document.getElementById("hp").innerHTML = `HP: ${this.player.lifetime}`  
        document.getElementById("score").innerHTML = `Score: ${this.player.score}`     
    },
    draw: function(ctx) {
        for (let e = 0; e < this.entities.length; e++)
            this.entities[e].draw (ctx)
    },
    loadAll: function(mapname) {
        this.entities = []
        mapManager = Object.create (mapManager)
        mapManager.loadMap (mapname)
        spriteManager.loadAtlas ("./atlas.json", "./Images/sprite.png")
        gameManager.factory["Player"] = Player;
        gameManager.factory["Enemy"] = Enemy;
        gameManager.factory["Hp"] = Hp;
        gameManager.factory["Damage"] = Damage;
        gameManager.factory["FireBall"] = FireBall
        gameManager.factory["Score"] = Score;
        gameManager.factory["Door"] = Door;
        gameManager.factory["Flag"] = Flag;
        gameManager.factory["Candlestick"] = Candlestick;
        mapManager.parseEntities();
        mapManager.draw(ctx);
        eventsManager.setup (canvas);
    },
    updateWorld: function () {
        if (gameManager.newlevel != null) {
            gameManager.isAllLoaded = false;
            mapManager.imgLoadCount = 0;
            mapManager.tLayers = new Array();
            mapManager.tilesets = new Array();
            mapManager.jsonLoaded = false;
            mapManager.imgLoaded = false;
            spriteManager.jsonLoaded = false;
            spriteManager.imgLoaded = false
            gameManager.loadAll (gameManager.newlevel)
            gameManager.newlevel = null;
        }
        gameManager.update();
    },
    play: function() {
        this.interval = setInterval (this.updateWorld, 16.166666);
    },
    stopGame: function () {
        clearInterval(this.interval);
        let name = localStorage["username"];
        localStorage[name] = this.player.score;
        this.addRecords();
    },
    addRecords: function () {
        let dialog = document.getElementById("dialog")
        let table = dialog.getElementsByTagName("table")[0]
        let tbody = table.getElementsByTagName("tbody")[0]
        table.removeChild(tbody);
        tbody = document.createElement("tbody");

        let row = document.createElement("tr");
        let th = document.createElement("th");
        let Text = document.createTextNode ("Player")
        th.appendChild(Text);
        row.appendChild(th);

        Text = document.createTextNode ("Scores");
        th = document.createElement("th");
        th.appendChild(Text);
        row.appendChild(th);
        tbody.appendChild(row);
        
        let arr = []
        for (let i = 0; i < localStorage.length; i++) {
            let name = localStorage.key(i)
            if (name == "username")
                continue
            arr.push ({name: name, scores: localStorage.getItem (name)})
        }
        arr.sort ((a,b) => b.scores - a.scores)
    
        for (let i = 0; i < arr.length; i++) {
            row = document.createElement("tr");
            Text = document.createTextNode (arr[i].name);
            let td = document.createElement("td");
            td.appendChild (Text);
            row.appendChild (td);

            td = document.createElement("td");
            Text = document.createTextNode (arr[i].scores);
            td.appendChild(Text);
            row.appendChild(td);

            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        dialog.showModal();
    },

}

let canvas = document.getElementById ("field");
let ctx = canvas.getContext ("2d");
document.getElementById ("player").innerHTML = "Player: " + localStorage["username"];
document.getElementById ("restart").onclick = () => {
    document.getElementById("dialog").close();
    gameManager.player = null;
    gameManager.newlevel = "./Level_1.json"
    gameManager.updateWorld()
    gameManager.play()
}
document.getElementById ("new_user").onclick = () => {
    document.getElementById("dialog").close();
    window.location = "index.html";
}
ctx.imageSmoothingEnabled = false;
ctx.scale (4,4);
soundManager.init()
soundManager.load ("./Sounds/Fireball.mp3", function() {})
soundManager.loadArray ([
    "./Sounds/Fireball.mp3",
    "./Sounds/24_orc_death_spin.wav",
    "./Sounds/11_human_damage_3.wav",
    "./Sounds/21_orc_damage_1.wav",
    "./Sounds/14_human_death_spin.wav",
    "./Sounds/25_orc_walk_stone_1.wav",
    "./Sounds/25_orc_walk_stone_2.wav",
    "./Sounds/25_orc_walk_stone_3.wav",
    "./Sounds/16_human_walk_stone_1.wav",
    "./Sounds/16_human_walk_stone_2.wav",
    "./Sounds/16_human_walk_stone_3.wav",
    "./Sounds/04_sack_open_3.wav"
])
gameManager.ctx = ctx;
gameManager.loadAll("./Level_1.json");
gameManager.play();