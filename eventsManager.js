var eventsManager = {
    bind: [],
    action: [],
    setup: function (canvas) {
        this.bind[87] = 'up';
        this.bind[65] = 'left';
        this.bind[83] = 'down';
        this.bind[68] = 'right';
        this.bind[32] = 'fire';
        canvas.addEventListener ("mousedown", this.onMouseDown);
        canvas.addEventListener ("mouseup", this.onMouseUp);
        document.body.addEventListener ("keydown", this.onKeyDown);
        document.body.addEventListener ("keyup", this.onKeyUp);
        // обработчики действий 
    }
}

export default eventsManager;