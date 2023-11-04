var physicManager = {
    update: function (obj) {
        if (obj.move_x == 0 && obj.move_y == 0)
            return "stop"

        var newx = obj.pos_x + Math.floor (obj.move_x * obj.speed)
        var newy = obj.pos_y + Math.floor (obj.move_y * obj.speed);

        var ts = mapManager.getTilesetIdx (newx + obj.size_x / 2, newy + obj.size_y / 2)
        var e = this.entityAtxy (obj, newx, newy);
        if (e !== null && obj.onTouchEntity)
            obj.onTouchEntity(e);
        if (ts !== 7 && obj.onTouchMap)
            obj.onTouchMap(ts);
        if (ts === 7 && e === null) {
            obj.pos_x = newx;
            obj.pos_y = newy;
        }
        else 
            return "break"
        
        return "move";
    },

    entityAtxy: function (obj, x, y) {
        for (let i = 0; i < gameManager.entities.length; i++) {
            let e = gameManager.entities[i];
            if (e.name !== obj.name) {
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

export default physicManager;