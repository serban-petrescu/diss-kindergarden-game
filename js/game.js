/* global me, Promise */

var game = {
    data: {},

    onload: function () {
        if (!me.video.init(960, 640, {wrapper : "screen", scale : "auto"})) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }

        me.audio.init("mp3,ogg");

        me.loader.preload(game.resources, this.loaded.bind(this));
        me.state.STORY = me.state.USER + 1;
        me.state.QUIZ = me.state.USER + 2;
    },
    
    loaded: function () {
        me.input.bindKey(me.input.KEY.LEFT, "left");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.UP, "up");
        me.input.bindKey(me.input.KEY.DOWN, "down");
        me.pool.register("player", game.PlayerEntity);
        me.pool.register("collectable", game.CollectableEntity);

        me.state.set(me.state.MENU, new game.TitleScreen());
        me.state.set(me.state.STORY, new game.StoryScreen());
        me.state.set(me.state.PLAY, new game.PlayScreen());
        me.state.set(me.state.QUIZ, new game.QuizScreen());
        this.prepare();
        this.next();
    },

    prepare: function() {
        game.data = me.loader.getJSON("game_data");
        game.data.index = -1;
    },

    playSound: function(name) {
        if (name) {
            return new Promise(function(resolve) {
                me.audio.play(name, false, resolve);
            });
        } else {
            return Promise.resolve();
        }
    },

    playCongrats: function() {
        return this.playSound(this.data.congrats[Math.floor(Math.random() * this.data.congrats.length)]);
    },

    playWrong: function() {
        return this.playSound(this.data.wrong[Math.floor(Math.random() * this.data.wrong.length)]);
    },

    reset: function() {
        game.data.index = 0;
        me.state.change(me.state.MENU);
    },

    next: function() {
        var outro = game.data.sequence[game.data.index] ? game.data.sequence[game.data.index].outro : "";
        game.data.index = (game.data.index + 1) % game.data.sequence.length;
        game.data.current = game.data.sequence[game.data.index].data || {};
        game.data.current.score = 0;
        return game.data.current.start = this.playSound(outro)
            .then(me.state.change.bind(me.state, me.state[game.data.sequence[game.data.index].state]))
            .then(this.playSound.bind(this, game.data.sequence[game.data.index].intro));
    },

    delay: function(millis) {
        return new Promise(function(resolve) {
            me.timer.setTimeout(resolve, millis);
        });
    }
};
