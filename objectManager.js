export var Entity = {
    pos_x: 0,
    pos_y: 0,
    size_x: 0,
    size_y: 0,
    extend: function (extendProto) {
        var object = Object.create(this);
        for (let property in extendProto) {
            if (this.hasOwnProperty(property) || typeof object[property] === 'undefined')
                object[property] = extendProto[property];
        }
        return object;
    }
}

export var Player = Entity.extend ({
    lifetime:100,
    damage: 20,
    move_x: 0,
    move_y: 0,
    speed: 1,
    draw: function (ctx) {
        spriteManager.drawSprite (ctx, "Player", this.pos_x, this.pos_y)
    },
    update: function (ctx) {
        physicManager.update (this)
    },
    onTouchEntity: function (obj) {
        if (obj.name.match (/Coin[\d]/)) {
            this.lifetime += obj.value;
            obj.kill();
        }
    },
    kill: function () {},
    fire: function () {},
})

export var Enemy = Entity.extend( {
    lifetime: 60,
    move_x: 0,
    move_y: 0,
    speed: 1,
    draw: function (ctx) {
        spriteManager.drawSprite (ctx, "Enemy", this.pos_x, this.pos_y)
    },
    update: function (ctx) {
        physicManager.update(this)
    },
    onTouchEntity: function (obj) {},
    kill: function () {},
    fire: function () {
        var b = Object.create (FireBall)
        b.size_x = 2;
        b.size_y = 2;
        b.name = "fireball" + (++gameManager.fireNum);
        b.move_x = this.move_x;
        b.move_y = this.move_y;
        switch (this.move_x + 2 * this.move_y) {
            case -1:
                b.pos_x = this.pos_x - b.size_x;
                b.pos_y = this.pos_y;
                break;
            case 1:
                b.pos_x = this.pos_x + b.size_x;
                b.pos_y = this.pos_y;
                break;
            case 1:
                b.pos_x = this.pos_x;
                b.pos_y = this.pos_y - b.size_y;
                break;
            case 1:
                b.pos_x = this.pos_x;
                b.pos_y = this.pos_y + b.size_y;
                break;
        }
        gameManager.entities.push(b);
    },
})

export var Hp = Entity.extend ( {
    value: 20,
    draw: function (ctx) {
        spriteManager.drawSprite (ctx, "Hp", this.pos_x, this.pos_y)
    },
    kill: function () {},
})

export var Damage = Entity.extend( {
    value: 10,
    draw: function (ctx) {
        spriteManager.drawSprite (ctx, "Damage", this.pos_x, this.pos_y)
    },
    kill: function () {},
})

export var FireBall = Entity.extend ({
    move_x: 0,
    move_y: 0,
    damage: 20,
    speed: 4,
    draw: function (ctx) {
        spriteManager.drawSprite (ctx, "FireBall", this.pos_x, this.pos_y)
    },
    update: function (ctx) {
        physicManager.update (this)
    },
    onTouchMap: function (param) { 
        this.kill();
    },
    onTouchEntity: function (obj) {
        if (obj.name.match (/Enemy[\d*]/)) {
            obj.lifetime -= this.damage;
        }
        this.kill;
    },
    kill: function () {},
})

export var Score = Entity.extend ({
    draw: function (ctx) {
        spriteManager.drawSprite (ctx, "Score", this.pos_x, this.pos_y)
    },
})

var Door = Entity.extend ({

})

