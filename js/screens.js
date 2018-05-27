/* global game, me, Promise */
(function() {
    var OBJECT_GLOW_DURATION = 2000;

    // https://stackoverflow.com/a/6274381/7612556
    function shuffle(a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }

    function background(name) {
        var image = new (me.Sprite.extend({
            init: function() {
                this._super(me.Sprite, "init", [0, 0, {image: me.loader.getImage(name)}]);
            },
            update: function() {
                return true;
            }
        }))();
        image.anchorPoint.set(0, 0);
        image.scale(me.game.viewport.width / image.width, me.game.viewport.height / image.height);
        me.game.world.addChild(image, 1);
        return image;
    }

    function object(info) {
        var image = me.loader.getImage(info.name); 
        var sprite = new me.Sprite(info.x, info.y, {
            image: image,
            framewidth: image.width / 2,
            frameheight: image.height
        });
        sprite.addAnimation("default", [0]);
        sprite.addAnimation("glow", [0, 1], 500);
        sprite.setCurrentAnimation("default");
        me.game.world.addChild(sprite, 2);

        me.timer.setTimeout(function() {
            sprite.setCurrentAnimation("glow");
        }, info.glow_start);

        me.timer.setTimeout(function() {
            sprite.setCurrentAnimation("default");
        }, info.glow_start + OBJECT_GLOW_DURATION);

        return image;
    }

    function glowingButton(name, x, y, onClick) {
        var image = me.loader.getImage(name);
        var button = new (me.GUI_Object.extend({
            init: function() {
                this._super(me.GUI_Object, "init", [x, y, {
                    image: image,
                    framewidth: image.width / 2,
                    frameheight: image.height
                }]);
                this.addAnimation("glow", [0, 1], 500);
                this.addAnimation("default", [0]);
                this.setCurrentAnimation("default");
            },

            enable: function() {
                this.enabled = true;
            },

            disable: function() {
                this.enabled = false;
            },
            
            update: function() {
                return this._super(me.GUI_Object, "update", arguments) || this._super(me.Sprite, "update", arguments);
            },

            onClick: function() {
                if (this.enabled && onClick) {
                    onClick();
                }
            }
        }))();
        me.game.world.addChild(button);
        return button;
    }

    game.PlayScreen = me.ScreenObject.extend({
        onResetEvent: function() {
            game.data.current.info = me.loader.getJSON("game_" + game.data.current.index + "_info");
            background(game.data.current.info.guidelines);
            game.data.current.start.then(this.start.bind(this, game.data.current.info.map));
        },
    
        start: function(name) {
            me.levelDirector.loadLevel(name);
            me.game.repaint();
        }
    });
    
    game.QuizScreen = me.ScreenObject.extend({
        onResetEvent: function () {
            game.data.current.script = me.loader.getJSON("quiz_" + game.data.current.index + "_script");
            background("quiz_background");
            game.data.current.start.then(this.start.bind(this));
        },
    
        start: function() {
            this.buttons = [];
            this.options = [];
            this.initData();
            this.addButtons();
            this.addOptions();
        },

        next: function() {
            this.clearOptions();
            game.data.current.data.shift();
            if (!game.data.current.data.length) {
                this.initData();
            }
            this.buttons.forEach(function(b) {
                b.enable();
            });
            this.addOptions();
        },

        answer: function(index) {
            this.buttons.forEach(function(b) {
                b.disable();
            });

            var button = this.buttons[game.data.current.data[0].correct];
            button.setCurrentAnimation("glow");

            if (index === game.data.current.data[0].correct) {
                if (game.data.current.score++ === game.data.current.script.maxScore) {
                    game.next();
                } else {
                    game.playCongrats()
                        .then(this.next.bind(this))
                        .then(button.setCurrentAnimation.bind(button, "default"));
                }
            } else {
                game.playWrong()
                    .then(game.delay(OBJECT_GLOW_DURATION))
                    .then(this.next.bind(this))
                    .then(button.setCurrentAnimation.bind(button, "default"));
            }
        },

        initData: function() {
            var correct = shuffle(game.data.current.script.options.correct.slice(0)),
                wrong = shuffle(game.data.current.script.options.wrong.slice(0)),
                wrongCount = game.data.current.script.options.display - 1,
                data = [];
            for (var i = 0, j = 0; i < correct.length && j <= wrong.length - wrongCount; ++i, j += wrongCount) {
                var options = wrong.slice(j, j + wrongCount);
                var correctIndex = Math.floor(wrongCount * Math.random());
                options.splice(correctIndex, 0, correct[i]);
                data.push({
                    correct: correctIndex,
                    options: options
                });
            }
            game.data.current.data = data;
        },

        addOptions: function() {
            var n = game.data.current.data[0].options.length;
            for (var i = 0; i < n; ++i) {
                var image = me.loader.getImage(game.data.current.data[0].options[i]), 
                    option = new me.Sprite(me.game.viewport.width / 2, me.game.viewport.height * (i + 1) / (n + 1), {
                        image: image
                    });
                me.game.world.addChild(option, 5);
                this.options.push(option);
            }
        },

        addButtons: function() {
            var n = game.data.current.script.options.display;
            for (var i = 0; i < n; ++i) {
                var button = glowingButton("square_empty_sprite", me.game.viewport.width / 2, 
                    me.game.viewport.height * (i + 1) / (n + 1), this.answer.bind(this, i));
                button.enable();
                this.buttons.push(button);
            }
        },

        clear: function() {
            (this.buttons || []).forEach(me.game.world.removeChild.bind(me.game.world));
            this.buttons = [];
            this.clearOptions();
        }, 

        clearOptions: function() {
            (this.options || []).forEach(me.game.world.removeChild.bind(me.game.world));
            this.options = [];
        }
    });
    
    game.StoryScreen = me.ScreenObject.extend({
        onResetEvent: function() {
            game.data.current.script = me.loader.getJSON("story_" + game.data.current.index + "_script");
            background("story_background");
            game.data.current.start.then(this.playStory.bind(this, game.data.current.script.track, game.data.current.nextSound));
        },

        playStory: function(audio, nextSound) {
            this.addObjects();
            game.playSound(audio)
                .then(function() {
                    var button = glowingButton("button_next_sprite", me.game.viewport.width / 2, 
                        me.game.viewport.height - 50, game.next.bind(game));
                    this.objects.push(button);
                    return (nextSound ? game.playSound("next") : Promise.resolve()).then(function() {
                        button.enable();
                        button.setCurrentAnimation("glow");
                    });
                }.bind(this))
        },

        addObjects: function() {
            this.objects = [];
            for (var i = 0; i < game.data.current.script.objects.length; ++i) {
                this.objects.push(object(game.data.current.script.objects[i]));
            }
        }
    });
    
    game.TitleScreen = me.ScreenObject.extend({
        onResetEvent: function () {
            background("title_screen");
            this.createTitle();
            var start = glowingButton("button_start_sprite", me.game.viewport.width / 2, 350, function() {
                game.next();
            });
            game.data.current.start.then(function() {
                start.enable();
                start.setCurrentAnimation("glow");
            });
        },
    
        createTitle: function() {
            var image = new me.GUI_Object(me.game.viewport.width / 2, 100, {
                image: me.loader.getImage("title_header"),
            });
            me.game.world.addChild(image);
            return image;
        }
    });
    
})();
