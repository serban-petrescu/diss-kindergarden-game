/* global game, me */

game.PlayerEntity = me.Entity.extend({
    init: function (x, y, settings) {
        this._super(me.Entity, 'init', [x, y, settings]);
        this.body.setVelocity(3, 3);
        this.body.setFriction(0.4, 0.4);
        this.body.gravity = 0;
        this.alwaysUpdate = true;

        this.renderable.addAnimation("walk-up", [0, 1, 2]);
        this.renderable.addAnimation("walk-down", [3, 4, 5]);
        this.renderable.addAnimation("walk-right", [6, 7, 8]);
        this.renderable.addAnimation("walk-left", [9, 10, 11]);

        this.renderable.addAnimation("stand-up", [1]);
        this.renderable.addAnimation("stand-down", [4]);
        this.renderable.addAnimation("stand-right", [7]);
        this.renderable.addAnimation("stand-left", [10]);

        this.renderable.setCurrentAnimation("stand-down");
    },

    update: function (dt) {
        if (me.input.isKeyPressed("left")) {
            this.body.vel.x -= this.body.accel.x * me.timer.tick;
            this.body.vel.y = 0;
            if (!this.renderable.isCurrentAnimation("walk-left")) {
                this.renderable.setCurrentAnimation("walk-left");
            }
        } else if (me.input.isKeyPressed("right")) {
            this.body.vel.x += this.body.accel.x * me.timer.tick;
            this.body.vel.y = 0;
            if (!this.renderable.isCurrentAnimation("walk-right")) {
                this.renderable.setCurrentAnimation("walk-right");
            }
        } else if (me.input.isKeyPressed("up")) {
            this.body.vel.y -= this.body.accel.y * me.timer.tick;
            this.body.vel.x = 0;
            if (!this.renderable.isCurrentAnimation("walk-up")) {
                this.renderable.setCurrentAnimation("walk-up");
            }
        } else if (me.input.isKeyPressed("down")) {
            this.body.vel.y += this.body.accel.y * me.timer.tick;
            this.body.vel.x = 0;
            if (!this.renderable.isCurrentAnimation("walk-down")) {
                this.renderable.setCurrentAnimation("walk-down");
            }
        }  else {
            if (this.renderable.isCurrentAnimation("walk-left")) {
                this.renderable.setCurrentAnimation("stand-left");
            } else if (this.renderable.isCurrentAnimation("walk-right")) {
                this.renderable.setCurrentAnimation("stand-right");
            } else if (this.renderable.isCurrentAnimation("walk-up")) {
                this.renderable.setCurrentAnimation("stand-up");
            } else if (this.renderable.isCurrentAnimation("walk-down")) {
                this.renderable.setCurrentAnimation("stand-down");
            }
        }

        me.collision.check(this);
        this.body.update(dt);
        this._super(me.Entity, 'update', [dt]);

        return true;
    },

    onCollision: function() {
        return true;
    }
});

game.CollectableEntity  = me.Entity.extend({
    init: function (x, y, settings) {
        settings.image = me.loader.getImage(settings.image);
        settings.framewidth = settings.image.width / 2;
        settings.frameheight = settings.image.height;
        this._super(me.Entity, 'init', [x, y, settings]);

        this.renderable.addAnimation("glow", [0, 1], 500);
        this.renderable.setCurrentAnimation("glow");
        this.renderable.scale(settings.width / settings.image.width * 2, settings.height / settings.image.height);
    },

    onCollision: function () {
        this.body.setCollisionMask(me.collision.types.NO_OBJECT);
        me.game.world.removeChild(this);
        ++game.data.current.score;
        if (game.data.current.score === game.data.current.info.maxScore) {
            game.next();
        } else {
            game.playCongrats();
        }
        return false;
    }
});