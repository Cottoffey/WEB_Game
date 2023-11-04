
var mapManager = {
    mapData:null,
    tLayers: new Array(),
    xCount:0,
    yCount:0,
    tSize: {x:16, y:16},
    mapSize: {x:480, y:320},
    view: {x:0, y:0, w:240, h:160},
    tilesets: new Array(),
    imgLoadCount: 0,
    imgLoaded: false,
    jsonLoaded: false,
    scale: 2,

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

    loadMap: function  (path) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
                mapManager.parseMap (request.responseText);
            }
        }
        request.open ("GET", path, true);
        request.send();
        // this.parseMap (path);
        // console.log("Load map finish")
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
                        ctx.drawImage (tile.img, tile.px, tile.py, this.tSize.x , this.tSize.y, px * this.scale , py * this.scale, this.tSize.x * this.scale, this.tSize.y * this.scale);
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
            this.view.x = 0;
        else if (x > this.mapSize.x - this.view.w / 2)
            this.view.x = this.mapSize.x - this.view.w;
        else
            this.view.x = x - (this.view.w / 2)

        if (y < this.view.h / 2)
            this.view.y = 0
        else if (y > this.mapSize.y - this.view.h / 2)
            this.view.y = this.mapSize.y - this.view.h;
        else 
            this.view.y = y - (this.view.h / 2);
    },

    getTilesetdx (x,y) {
        let wx = x;
        let wy = y;
        let idx = Math.floor (wy / this.tSize.y ) * this.xCount + Math.floor (wx / this.tSize.x)
        return this.tLayers.data[idx];
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
                            obj.pos_x = e.x;
                            obj.pos_y = e.y;
                            obj.size_x = e.width;
                            obj.size_y = e.height;
                            gameManager.entities.push (obj);
                            if (obj.name === "Player")
                                gameManager.initPlayer (obj);
                        }
                        catch (ex) {
                            console.log("Error while creating: [" + e.gid + "] " + e.type + ", " + ex);
                        }
                    }
                }
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

export default mapManager;

// document.addEventListener ("keydown", (event) => {
//     const keyName = event.key;
//     console.log ("Keydown: " + keyName);
//     if (keyName == 'a') {
//         mapManager.changeView (-10, 0)
//         mapManager.draw (ctx);
//     }
//     if (keyName == 'd') {
//         mapManager.changeView (10, 0)
//         mapManager.draw (ctx);
//     }
//     if (keyName == 'w') {
//         mapManager.changeView (0, -10)
//         mapManager.draw (ctx);
//     }
//     if (keyName == 's') {
//         mapManager.changeView (0, 10)
//         mapManager.draw (ctx);
//     }

// })
