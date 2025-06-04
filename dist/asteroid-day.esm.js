function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z$1 = "/* Style for Asteroids.js\n * Copyright (c) 2010 James Socol <me@jamessocol.com>\n * See LICENSE.txt for license.\n */\n\n/* body {\n  background-color: #000;\n  color: #fff;\n  font-family: \"Calibri\", \"System\", monospace;\n  font-size: 14px;\n} */\n\n@keyframes fadeIn {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n\ndiv#asteroids-day-game-container {\n  animation-name: fadeIn;\n  animation-duration: 1s;\n\n  background-color: hsla(0, 0%, 0%, 0.9);\n  color: white;\n  position: fixed;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n}\n\ndiv#asteroids-day-game {\n  background-color: black;\n  margin: 50px auto;\n  width: 640px;\n  border: 1px solid #fff;\n  padding: 5px;\n}\n\ndiv#asteroids-day-game > * {\n  color: #fff;\n}\n\ndiv#asteroids-day-game > div {\n  font-family: \"System\", monospace;\n  font-size: 11px;\n  padding-bottom: 5px;\n}\n\ndiv#asteroids-day-game > div > span {\n  float: right;\n  padding-left: 20px;\n}\n\ndiv#instructions {\n  width: 640px;\n  margin: 20px auto;\n}\n\nh1 {\n  font-size: 18px;\n}\n\nh2 {\n  font-size: 16px;\n}\n";
styleInject(css_248z$1);

// Asteroids.js

// Game settings
const GAME_HEIGHT = 480;
const GAME_WIDTH = 640;
const FRAME_PERIOD = 60; // 1 frame / x frames/sec
const LEVEL_TIMEOUT = 2000; // How long to wait after clearing a level.

// Player settings
const ROTATE_SPEED = Math.PI / 10; // How fast do players turn?  (radians)
const MAX_SPEED = 15; // Maximum player speed
const THRUST_ACCEL = 1;
const DEATH_TIMEOUT = 2000; // milliseconds
const INVINCIBLE_TIMEOUT = 1500; // How long to stay invincible after resurrecting?
const PLAYER_LIVES = 3;
const POINTS_PER_SHOT = 1; // How many points does a shot cost? (Should be >= 0.)
const POINTS_TO_EXTRA_LIFE = 1000; // How many points to get a 1-up?

// Bullet settings
const BULLET_SPEED = 20;
const MAX_BULLETS = 3;
const MAX_BULLET_AGE = 25;

// Asteroid settings
const ASTEROID_COUNT = 2; // This + current level = number of asteroids.
const ASTEROID_GENERATIONS = 3; // How many times to they split before dying?
const ASTEROID_CHILDREN = 2; // How many does each death create?
const ASTEROID_SPEED = 3;
const ASTEROID_SCORE = 10; // How many points is each one worth?

const Asteroids = function (home, options) {
  // Constructor
  // Order matters.

  // Set up logging.
  this.log_level = options.log_level || Asteroids.LOG_DEBUG;
  this.log = Asteroids.logger(this);

  // Create the info pane, player, and playfield.
  home.innerHTML = "";
  this.info = Asteroids.infoPane(this, home);
  this.playfield = Asteroids.playfield(this, home);
  this.player = Asteroids.player(this);

  // Set up the event listeners.
  this.keyState = Asteroids.keyState(this);
  this.listen = Asteroids.listen(this);
  this._removeKeyListeners = Asteroids.listen(this);

  // Useful functions.
  this.asteroids = Asteroids.asteroids(this);
  this.overlays = Asteroids.overlays(this);
  this.highScores = Asteroids.highScores(this);
  this.level = Asteroids.level(this);
  this.gameOver = Asteroids.gameOver(this);

  // Play the game.
  Asteroids.play(this);

  // Expose an `end()` method on each instance:
  this.end = function () {
    if (this.pulse) {
      clearInterval(this.pulse);
    }
    if (
      this._removeKeyListeners &&
      typeof this._removeKeyListeners.remove === "function"
    ) {
      this._removeKeyListeners.remove();
    }
  };
  return this;
};

Asteroids.infoPane = function (game, home) {
  var pane = document.createElement("div");
  pane.innerHTML = "ASTEROIDS";

  var lives = document.createElement("span");
  lives.className = "lives";
  lives.innerHTML = "LIVES: " + PLAYER_LIVES;

  var score = document.createElement("span");
  score.className = "score";
  score.innerHTML = "SCORE: 0";

  var level = document.createElement("span");
  level.className = "level";
  level.innerHTML = "LEVEL: 1";

  pane.appendChild(lives);
  pane.appendChild(score);
  pane.appendChild(level);
  home.appendChild(pane);

  return {
    setLives: function (game, l) {
      lives.innerHTML = "LIVES: " + l;
    },
    setScore: function (game, s) {
      score.innerHTML = "SCORE: " + s;
    },
    setLevel: function (game, _level) {
      level.innerHTML = "LEVEL: " + _level;
    },
    getPane: function () {
      return pane;
    },
  };
};

Asteroids.playfield = function (game, home) {
  var canvas = document.createElement("canvas");
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  home.appendChild(canvas);
  return canvas;
};

Asteroids.logger = function (game) {
  if (typeof console != "undefined" && typeof console.log != "undefined") {
    return {
      info: function (msg) {
        if (game.log_level <= Asteroids.LOG_INFO) console.log(msg);
      },
      debug: function (msg) {
        if (game.log_level <= Asteroids.LOG_DEBUG) console.log(msg);
      },
      warning: function (msg) {
        if (game.log_level <= Asteroids.LOG_WARNING) console.log(msg);
      },
      error: function (msg) {
        if (game.log_level <= Asteroids.LOG_ERROR) console.log(msg);
      },
      critical: function (msg) {
        if (game.log_level <= Asteroids.LOG_CRITICAL) console.log(msg);
      },
    };
  } else {
    return {
      info: function (msg) {},
      debug: function (msg) {},
      warning: function (msg) {},
      error: function (msg) {},
      critical: function (msg) {},
    };
  }
};

Asteroids.asteroids = function (game) {
  var asteroids = [];

  return {
    push: function (obj) {
      return asteroids.push(obj);
    },
    pop: function () {
      return asteroids.pop();
    },
    splice: function (i, j) {
      return asteroids.splice(i, j);
    },
    get length() {
      return asteroids.length;
    },
    getIterator: function () {
      return asteroids;
    },
    generationCount: function (_gen) {
      var total = 0;
      for (let i = 0; i < asteroids.length; i++) {
        if (asteroids[i].getGeneration() == _gen) total++;
      }
      game.log.debug("Found " + total + " asteroids in generation " + _gen);
      return total;
    },
  };
};

/**
 * Creates an overlays controller.
 */
Asteroids.overlays = function (game) {
  var overlays = [];

  return {
    draw: function (ctx) {
      for (let i = 0; i < overlays.length; i++) {
        overlays[i].draw(ctx);
      }
    },
    add: function (obj) {
      if (-1 == overlays.indexOf(obj) && typeof obj.draw != "undefined") {
        overlays.push(obj);
        return true;
      }
      return false;
    },
    remove: function (obj) {
      let i = overlays.indexOf(obj);
      if (-1 != i) {
        overlays.splice(i, 1);
        return true;
      }
      return false;
    },
  };
};

/**
 * Creates a player object.
 */
Asteroids.player = function (game) {
  // implements IScreenObject
  var position = [GAME_WIDTH / 2, GAME_HEIGHT / 2],
    velocity = [0, 0],
    direction = -Math.PI / 2,
    dead = false,
    invincible = false,
    lastRez = null,
    lives = PLAYER_LIVES,
    score = 0,
    radius = 3,
    path = [
      [10, 0],
      [-5, 5],
      [-5, -5],
      [10, 0],
    ];

  return {
    getPosition: function () {
      return position;
    },
    getVelocity: function () {
      return velocity;
    },
    getSpeed: function () {
      return Math.sqrt(Math.pow(velocity[0], 2) + Math.pow(velocity[1], 2));
    },
    getDirection: function () {
      return direction;
    },
    getRadius: function () {
      return radius;
    },
    getScore: function () {
      return score;
    },
    addScore: function (pts) {
      score += pts;
    },
    lowerScore: function (pts) {
      score -= pts;
      if (score < 0) {
        score = 0;
      }
    },
    getLives: function () {
      return lives;
    },
    rotate: function (rad) {
      if (!dead) {
        direction += rad;
        game.log.info(direction);
      }
    },
    thrust: function (force) {
      if (!dead) {
        velocity[0] += force * Math.cos(direction);
        velocity[1] += force * Math.sin(direction);

        if (this.getSpeed() > MAX_SPEED) {
          velocity[0] = MAX_SPEED * Math.cos(direction);
          velocity[1] = MAX_SPEED * Math.sin(direction);
        }

        game.log.info(velocity);
      }
    },
    move: function () {
      Asteroids.move(position, velocity);
    },
    draw: function (ctx) {
      let color = "#fff";
      if (invincible) {
        const dt = (new Date() - lastRez) / 200;
        const c = Math.floor(Math.cos(dt) * 16).toString(16);
        color = `#${c}${c}${c}`;
      }
      Asteroids.drawPath(ctx, position, direction, 1, path, color);
    },
    isDead: function () {
      return dead;
    },
    isInvincible: function () {
      return invincible;
    },
    extraLife: function (game) {
      game.log.debug("Woo, extra life!");
      lives++;
    },
    die: function (game) {
      if (!dead) {
        game.log.info("You died!");
        dead = true;
        invincible = true;
        lives--;
        position = [GAME_WIDTH / 2, GAME_HEIGHT / 2];
        velocity = [0, 0];
        direction = -Math.PI / 2;
        if (lives > 0) {
          setTimeout(
            (function (player, _game) {
              return function () {
                player.resurrect(_game);
              };
            })(this, game),
            DEATH_TIMEOUT
          );
        } else {
          game.gameOver();
        }
      }
    },
    resurrect: function (game) {
      if (dead) {
        dead = false;
        invincible = true;
        lastRez = new Date();
        setTimeout(function () {
          invincible = false;
          game.log.debug("No longer invincible!");
        }, INVINCIBLE_TIMEOUT);
        game.log.debug("You ressurrected!");
      }
    },
    fire: function (game) {
      if (!dead) {
        game.log.debug("You fired!");
        var _pos = [position[0], position[1]],
          _dir = direction;

        this.lowerScore(POINTS_PER_SHOT);

        return Asteroids.bullet(game, _pos, _dir);
      }
    },
  };
};

Asteroids.bullet = function (game, _pos, _dir) {
  // implements IScreenObject
  var position = [_pos[0], _pos[1]],
    velocity = [0, 0],
    direction = _dir,
    age = 0,
    radius = 1,
    path = [
      [0, 0],
      [-4, 0],
    ];

  velocity[0] = BULLET_SPEED * Math.cos(_dir);
  velocity[1] = BULLET_SPEED * Math.sin(_dir);

  return {
    getPosition: function () {
      return position;
    },
    getVelocity: function () {
      return velocity;
    },
    getSpeed: function () {
      return Math.sqrt(Math.pow(velocity[0], 2) + Math.pow(velocity[1], 2));
    },
    getRadius: function () {
      return radius;
    },
    getAge: function () {
      return age;
    },
    birthday: function () {
      age++;
    },
    move: function () {
      Asteroids.move(position, velocity);
    },
    draw: function (ctx) {
      Asteroids.drawPath(ctx, position, direction, 1, path);
    },
  };
};

Asteroids.keyState = function (_) {
  var state = {
    [Asteroids.LEFT]: false,
    [Asteroids.UP]: false,
    [Asteroids.RIGHT]: false,
    [Asteroids.DOWN]: false,
    [Asteroids.FIRE]: false,
  };

  return {
    on: function (key) {
      state[key] = true;
    },
    off: function (key) {
      state[key] = false;
    },
    getState: function (key) {
      if (typeof state[key] != "undefined") return state[key];
      return false;
    },
  };
};

Asteroids.listen = function (game) {
  const keyMap = {
    ArrowLeft: Asteroids.LEFT,
    KeyA: Asteroids.LEFT,
    ArrowRight: Asteroids.RIGHT,
    KeyD: Asteroids.RIGHT,
    ArrowUp: Asteroids.UP,
    KeyW: Asteroids.UP,
    Space: Asteroids.FIRE,
  };

  window.addEventListener(
    "keydown",
    function (e) {
      const state = keyMap[e.code];
      if (state) {
        e.preventDefault();
        e.stopPropagation();
        game.keyState.on(state);
        return false;
      }
      return true;
    },
    true
  );

  window.addEventListener(
    "keyup",
    function (e) {
      const state = keyMap[e.code];
      if (state) {
        e.preventDefault();
        e.stopPropagation();
        game.keyState.off(state);
        return false;
      }
      return true;
    },
    true
  );
};

Asteroids.asteroid = function (game, _gen) {
  // implements IScreenObject
  var position = [0, 0],
    velocity = [0, 0],
    direction = 0,
    generation = _gen,
    radius = 7,
    path = [
      [1, 7],
      [5, 5],
      [7, 1],
      [5, -3],
      [7, -7],
      [3, -9],
      [-1, -5],
      [-4, -2],
      [-8, -1],
      [-9, 3],
      [-5, 5],
      [-1, 3],
      [1, 7],
    ];

  return {
    getPosition: function () {
      return position;
    },
    setPosition: function (pos) {
      position = pos;
    },
    getVelocity: function () {
      return velocity;
    },
    setVelocity: function (vel) {
      velocity = vel;
      direction = Math.atan2(vel[1], vel[0]);
    },
    getSpeed: function () {
      return Math.sqrt(Math.pow(velocity[0], 2) + Math.pow(velocity[1], 2));
    },
    getRadius: function () {
      return radius * generation;
    },
    getGeneration: function () {
      return generation;
    },
    move: function () {
      Asteroids.move(position, velocity);
    },
    draw: function (ctx) {
      Asteroids.drawPath(ctx, position, direction, generation, path);
      // ctx.setTransform(1, 0, 0, 1, position[0], position[1]);
      // ctx.beginPath();
      // ctx.arc(0, 0, radius*generation, 0, Math.PI*2, false);
      // ctx.stroke();
      // ctx.closePath();
    },
  };
};

Asteroids.collision = function (a, b) {
  // if a.getPosition() inside b.getBounds?
  var a_pos = a.getPosition(),
    b_pos = b.getPosition();

  function sq(x) {
    return Math.pow(x, 2);
  }

  var distance = Math.sqrt(sq(a_pos[0] - b_pos[0]) + sq(a_pos[1] - b_pos[1]));

  if (distance <= a.getRadius() + b.getRadius()) return true;
  return false;
};

Asteroids.level = function (game) {
  var level = 0,
    speed = ASTEROID_SPEED,
    hspeed = ASTEROID_SPEED / 2;

  return {
    getLevel: function () {
      return level;
    },
    levelUp: function (game) {
      level++;
      game.log.debug("Congrats! On to level " + level);
      while (
        game.asteroids.generationCount(ASTEROID_GENERATIONS) <
        level + ASTEROID_COUNT
      ) {
        var a = Asteroids.asteroid(game, ASTEROID_GENERATIONS);
        a.setPosition([
          Math.random() * GAME_WIDTH,
          Math.random() * GAME_HEIGHT,
        ]);
        a.setVelocity([
          Math.random() * speed - hspeed,
          Math.random() * speed - hspeed,
        ]);
        game.asteroids.push(a);
      }
    },
  };
};

Asteroids.gameOver = function (game) {
  return function () {
    game.log.debug("Game over!");

    if (game.player.getScore() > 0) {
      game.highScores.addScore("Player", game.player.getScore());
    }

    game.overlays.add({
      // implements IOverlay
      draw: function (ctx) {
        ctx.font = "30px System, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillText("GAME OVER", GAME_WIDTH / 2, GAME_HEIGHT / 2);

        var scores = game.highScores.getScores();
        ctx.font = "12px System, monospace";
        for (let i = 0; i < scores.length; i++) {
          ctx.fillText(
            scores[i].name + "   " + scores[i].score,
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 20 + 14 * i
          );
        }
      },
    });
  };
};

Asteroids.highScores = function (game) {
  var scores = [];

  const t = localStorage.getItem("high-scores");
  if (t) {
    scores = JSON.parse(t);
  }

  return {
    getScores: function () {
      return scores;
    },
    addScore: function (_name, _score) {
      scores.push({ name: _name, score: _score });
      scores.sort(function (a, b) {
        return b.score - a.score;
      });
      if (scores.length > 10) {
        scores.length = 10;
      }
      game.log.debug("Saving high scores.");
      var str = JSON.stringify(scores);
      localStorage.setItem("high-scores", str);
    },
  };
};

Asteroids.drawPath = function (ctx, position, direction, scale, path, color) {
  if (!color) {
    color = "#fff";
  }
  ctx.strokeStyle = color;
  ctx.setTransform(
    Math.cos(direction) * scale,
    Math.sin(direction) * scale,
    -Math.sin(direction) * scale,
    Math.cos(direction) * scale,
    position[0],
    position[1]
  );

  ctx.beginPath();
  ctx.moveTo(path[0][0], path[0][1]);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i][0], path[i][1]);
  }
  ctx.stroke();
  ctx.closePath();
  ctx.strokeStyle = "#fff";
};

Asteroids.move = function (position, velocity) {
  position[0] += velocity[0];
  if (position[0] < 0) position[0] = GAME_WIDTH + position[0];
  else if (position[0] > GAME_WIDTH) position[0] -= GAME_WIDTH;

  position[1] += velocity[1];
  if (position[1] < 0) position[1] = GAME_HEIGHT + position[1];
  else if (position[1] > GAME_HEIGHT) position[1] -= GAME_HEIGHT;
};

Asteroids.stars = function () {
  var stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push([Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT]);
  }

  return {
    draw: function (ctx) {
      let ii = stars.length;
      for (var i = 0; i < ii; i++) {
        ctx.fillRect(stars[i][0], stars[i][1], 1, 1);
      }
    },
  };
};

Asteroids.play = function (game) {
  var ctx = game.playfield.getContext("2d");
  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";

  var speed = ASTEROID_SPEED,
    hspeed = ASTEROID_SPEED / 2;

  game.level.levelUp(game);

  var bullets = [],
    last_fire_state = false,
    last_asteroid_count = 0;

  var extra_lives = 0;

  // Add a star field.
  game.overlays.add(Asteroids.stars());

  game.pulse = setInterval(function () {
    var kill_asteroids = [],
      new_asteroids = [],
      kill_bullets = [];

    ctx.save();
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Be nice and award extra lives first.
    var t_extra_lives = game.player.getScore() / POINTS_TO_EXTRA_LIFE;
    t_extra_lives = Math.floor(t_extra_lives);
    if (t_extra_lives > extra_lives) {
      game.player.extraLife(game);
    }
    extra_lives = t_extra_lives;

    if (game.keyState.getState(Asteroids.UP)) {
      game.player.thrust(THRUST_ACCEL);
    }

    if (game.keyState.getState(Asteroids.LEFT)) {
      game.player.rotate(-ROTATE_SPEED);
    }

    if (game.keyState.getState(Asteroids.RIGHT)) {
      game.player.rotate(ROTATE_SPEED);
    }

    var fire_state = game.keyState.getState(Asteroids.FIRE);
    if (
      fire_state &&
      fire_state != last_fire_state &&
      bullets.length < MAX_BULLETS
    ) {
      var b = game.player.fire(game);
      bullets.push(b);
    }
    last_fire_state = fire_state;

    if (!game.player.isDead()) {
      game.player.move();
      game.player.draw(ctx);
    }

    for (var k = 0; k < bullets.length; k++) {
      if (!bullets[k]) continue;

      if (bullets[k].getAge() > MAX_BULLET_AGE) {
        kill_bullets.push(k);
        continue;
      }
      bullets[k].birthday();
      bullets[k].move();
      bullets[k].draw(ctx);
    }

    for (var r = kill_bullets.length - 1; r >= 0; r--) {
      bullets.splice(r, 1);
    }

    var asteroids = game.asteroids.getIterator();
    for (let i = 0; i < game.asteroids.length; i++) {
      var killit = false;
      asteroids[i].move();
      asteroids[i].draw(ctx);

      // Destroy the asteroid
      for (var j = 0; j < bullets.length; j++) {
        if (!bullets[j]) continue;
        if (Asteroids.collision(bullets[j], asteroids[i])) {
          game.log.debug("You shot an asteroid!");
          // Destroy the bullet.
          bullets.splice(j, 1);
          killit = true; // JS doesn't have "continue 2;"
          continue;
        }
      }

      // Kill the asteroid?
      if (killit) {
        var _gen = asteroids[i].getGeneration() - 1;
        if (_gen > 0) {
          // Create children ;)
          for (var n = 0; n < ASTEROID_CHILDREN; n++) {
            var a = Asteroids.asteroid(game, _gen);
            var _pos = [
              asteroids[i].getPosition()[0],
              asteroids[i].getPosition()[1],
            ];
            a.setPosition(_pos);
            a.setVelocity([
              Math.random() * speed - hspeed,
              Math.random() * speed - hspeed,
            ]);
            new_asteroids.push(a);
          }
        }
        game.player.addScore(ASTEROID_SCORE);
        kill_asteroids.push(i);
        continue;
      }

      // Kill the player?
      if (
        !game.player.isDead() &&
        !game.player.isInvincible() &&
        Asteroids.collision(game.player, asteroids[i])
      ) {
        game.player.die(game);
      }
    }

    kill_asteroids.sort(function (a, b) {
      return a - b;
    });
    for (var m = kill_asteroids.length - 1; m >= 0; m--) {
      game.asteroids.splice(kill_asteroids[m], 1);
    }

    for (var o = 0; o < new_asteroids.length; o++) {
      game.asteroids.push(new_asteroids[o]);
    }

    ctx.restore();

    // Do we need to level up?
    if (0 == game.asteroids.length && last_asteroid_count != 0) {
      setTimeout(function () {
        game.level.levelUp(game);
      }, LEVEL_TIMEOUT);
    }

    last_asteroid_count = game.asteroids.length;

    // Draw overlays.
    game.overlays.draw(ctx);

    // Update the info pane.
    game.info.setLives(game, game.player.getLives());
    game.info.setScore(game, game.player.getScore());
    game.info.setLevel(game, game.level.getLevel());
  }, FRAME_PERIOD);
};

// Some boring constants.
Asteroids.LOG_ALL = 0;
Asteroids.LOG_INFO = 1;
Asteroids.LOG_DEBUG = 2;
Asteroids.LOG_WARNING = 3;
Asteroids.LOG_ERROR = 4;
Asteroids.LOG_CRITICAL = 5;
Asteroids.LOG_NONE = 6;

Asteroids.LEFT = 37;
Asteroids.UP = 38;
Asteroids.RIGHT = 39;
Asteroids.DOWN = 40;
Asteroids.FIRE = 32;

function createAsteroidsGame(containerElement, options = {}) {
  return new Asteroids(containerElement, {
    log_level: options.logLevel || Asteroids.LOG_NONE,
  });
}

var css_248z = "@import url(\"https://fonts.googleapis.com/css2?family=Lato:wght@400&family=Orbitron:wght@400..900&display=swap\");\n\n#asteroid-day-countdown {\n  --hover-transition-speed: 0.3s;\n  background: hsla(0, 0%, 100%, 0.9);\n  display: inline-flex;\n  align-items: center;\n  padding: 5px;\n  transition: background var(--hover-transition-speed);\n  cursor: pointer;\n  border-radius: 5px;\n\n  &:hover {\n    background: hsla(0, 0%, 0%, 0.9);\n    .countdown-timer {\n      color: white;\n    }\n    .digits {\n      color: orange;\n    }\n  }\n}\n\n.asteroid-day-message {\n  font-family: \"Lato\";\n  /* font-weight: bold; */\n  font-optical-sizing: auto;\n  color: white;\n  font-size: 24px;\n  text-align: center;\n  margin: 0 25%;\n\n  a {\n    color: orange;\n  }\n}\n\n@keyframes spin {\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n}\n\n#asteroid-day-countdown img {\n  animation: spin 40s linear infinite;\n}\n\n.countdown-timer {\n  font-family: \"Orbitron\";\n  font-weight: bold;\n  font-optical-sizing: auto;\n  color: hsla(0, 0%, 0%, 1);\n  transition: color var(--hover-transition-speed);\n\n  b {\n    opacity: 0.5;\n    font-weight: normal;\n  }\n\n  .digits {\n    transition: color var(--hover-transition-speed);\n    display: inline-block;\n    width: calc(6ch + 4px);\n  }\n}\n";
styleInject(css_248z);

var asteroidIconUrl = "data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%3Csvg%20width%3D%22800px%22%20height%3D%22800px%22%20viewBox%3D%220%200%2064%2064%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22m11.61%2021.55c1.45-1.32.19-4.94%204.06-7.06s6.13-1.38%206.13-1.38a5.67%205.67%200%200%201%201.87-.56c1.06-.13%202.56.5%206-1s5-2.94%208-3.06%207.81.93%209.94%202.93%202.25%207.5%205.12%2011.88%205.44%208.19%205.38%2011.19-1.94%205.93-5.19%2010.31a52.15%2052.15%200%200%201%20-6.5%207.56c-1%20.88-3.56%203.5-7.75%203.13s-8-2.25-9.56-2.63a8.8%208.8%200%200%200%20-4.75-.12%2025.69%2025.69%200%200%201%20-6.75%201.12c-1.56-.12-5.31-2.62-7.31-7s-5-14.69-4.3-17.69%203.55-5.75%205.61-7.62z%22%20fill%3D%22%231d1d1b%22%2F%3E%3Cpath%20d%3D%22m13.23%2021.86c.67-1%201.5-4.56%202.75-5.5s4.38-2.19%204.94-1.75a8.48%208.48%200%200%200%204.81%203c3.5.94%206%201.06%208.38-1.19a5.43%205.43%200%200%200%201.94-4.62%203%203%200%200%201%20.56-1.38c.25-.18%208.25.32%2010.06%202.63s2.25%208.75%204.94%2012.75%204.19%206.06%204.19%208.62-.69%204.82-3.5%208.07-6.82%209.31-8.82%2010.25a12.59%2012.59%200%200%201%20-7.31.81c-2.37-.5-5.06-3.38-9.25-2.94s-6.37%202.39-9.75%201.31-6.44-8.75-7.62-13.31-2.75-8.31-1.19-10.81%204.19-4.94%204.87-5.94z%22%20fill%3D%22%23e6e4da%22%2F%3E%3Cpath%20d%3D%22m23.05%2014.36c.32-.07%201.25%200%204.06-.44s6.31-2.87%206.56-2.43.06%203.12-1.06%204.06-3.88%201.12-5.63.81-4.5-1.87-3.93-2z%22%20fill%3D%22%23ffffff%22%2F%3E%3Cpath%20d%3D%22m16%2019.74a5.88%205.88%200%200%201%201.55-3c.58-.33%202.37-.88%202.5-.58s.45.75.12.91-1.79.25-2%20.79a10.68%2010.68%200%200%201%20-1.17%202.14c-.27.2-.89-.1-1-.26z%22%20fill%3D%22%231d1d1b%22%2F%3E%3Cpath%20d%3D%22m10.94%2026.82c.26-.22%201.54.21%201.38.5s-1.46%201.25-1.46%202.54.41%202.29.08%202.42-1.21.46-1.29-.08a8.64%208.64%200%200%201%20-.08-2.55%2011.84%2011.84%200%200%201%201.37-2.83z%22%20fill%3D%22%231d1d1b%22%2F%3E%3Cpath%20d%3D%22m40.82%2013.9a2.42%202.42%200%200%201%203.5%202.59c-.38%202.29-3.38%202.25-4.34%201.37a2.5%202.5%200%200%201%20.84-3.96z%22%20fill%3D%22%231d1d1b%22%2F%3E%3Cpath%20d%3D%22m41.33%2015a1.21%201.21%200%200%201%201.76%201.3c-.19%201.15-1.7%201.13-2.18.69a1.25%201.25%200%200%201%20.42-1.99z%22%20fill%3D%22%23ffffff%22%2F%3E%3Cpath%20d%3D%22m29.19%2021c.81-.26%202.81%200%202.63%202s-2.46%201.54-3.38%201.08-.92-2.72.75-3.08z%22%20fill%3D%22%231d1d1b%22%2F%3E%3Cpath%20d%3D%22m29.55%2022c.36-.09%201.22%200%201.13.89s-1.05.67-1.45.47a.8.8%200%200%201%20.32-1.36z%22%20fill%3D%22%23ffffff%22%2F%3E%3Cpath%20d%3D%22m19.61%2025.2c1.42-.68%205-.3%207.54.83s1.85%202.58.85%206.08-1.89%205.89-2.6%206.79a6.32%206.32%200%200%201%20-2.67%201.84c-.54.08-2.58.16-3-.29a4.19%204.19%200%200%200%20-2.33-1.84c-1.29-.25-2.63%200-3.42-1.75a7.19%207.19%200%200%201%20.5-6.33%2013.75%2013.75%200%200%201%205.13-5.33z%22%20fill%3D%22%231d1d1b%22%2F%3E%3Cpath%20d%3D%22m20.32%2026.07c.8-.3%204.25.5%205.45.88s2.05%201.08%201.88%202.12a58.3%2058.3%200%200%201%20-2.13%206.08c-.87%202.38-.87%202.92-2.16%203.71s-2.25%201.09-2.59.75a6.33%206.33%200%200%200%20-2.87-2c-1.5-.37-2.63-.66-2.79-1.12a7.78%207.78%200%200%201%20.37-5.38c1.17-2.11%203.59-4.58%204.84-5.04z%22%20fill%3D%22%23ffffff%22%2F%3E%3Cpath%20d%3D%22m39.11%2021.65a5.75%205.75%200%200%201%207.46%202.71%205.14%205.14%200%200%201%20-2.13%207.09c-2.12.91-6.25%201.45-8-1.17s-1.12-6.5%202.67-8.63z%22%20fill%3D%22%231d1d1b%22%2F%3E%3Cpath%20d%3D%22m41.77%2022.24a4.77%204.77%200%200%201%203.63%202.58c1.08%202.17.67%203.5-.08%204.54a5.68%205.68%200%200%201%20-5.55%201.79%203.61%203.61%200%200%201%20-2.87-2.95c-.08-.63-.17-1.71%200-1.71s1.33%202.37%201.67%202.29.66-.83.54-1a16.06%2016.06%200%200%201%20-1.58-2.71c.12-.12.54-1.12.75-.87s1.33%203.25%201.58%203.08.67-.92.5-1.21-1.54-2.5-1.33-2.71%201.16-.91%201.33-.75.71%202.17%201%202.21a.6.6%200%200%200%20.64-.62c-.06-.3-.52-1.88-.23-1.96z%22%20fill%3D%22%23ffffff%22%2F%3E%3Cpath%20d%3D%22m16.07%2033.4c-.13-.3.5-.87.83-.58s1.87%203.13%201.58%203.33-.54.34-.75.25a21.16%2021.16%200%200%201%20-1.66-3z%22%20fill%3D%22%231d1d1b%22%2F%3E%3Cpath%20d%3D%22m17.61%2030.86c.06-.29.54-.66.83-.5a22.57%2022.57%200%200%201%202%204.42.7.7%200%200%201%20-.5.79%2028.93%2028.93%200%200%201%20-2.33-4.71z%22%20fill%3D%22%231d1d1b%22%2F%3E%3Cpath%20d%3D%22m19.44%2028.78c-.06-.2.54-.75.79-.58a12.31%2012.31%200%200%201%201.5%203.87c-.08.58-.37.92-.58.75a38.56%2038.56%200%200%201%20-1.71-4.04z%22%20fill%3D%22%231d1d1b%22%2F%3E%3Cpath%20d%3D%22m21.69%2027.61c0-.24.83-.37%201-.25a4%204%200%200%201%20.46%201.92c-.17.37-.42.75-.67.46a6.45%206.45%200%200%201%20-.79-2.13z%22%20fill%3D%22%231d1d1b%22%2F%3E%3Cpath%20d%3D%22m31.9%2033.82a1.83%201.83%200%200%201%202.54%201.92c0%201.91-2.54%202-3.42%201.25s-.7-2.42.88-3.17z%22%20fill%3D%22%231d1d1b%22%2F%3E%3Cpath%20d%3D%22m32.24%2034.84a.74.74%200%200%201%201%20.78c0%20.79-1%20.82-1.39.51s-.26-.98.39-1.29z%22%20fill%3D%22%23ffffff%22%2F%3E%3Cpath%20d%3D%22m49.38%2030.93a2.29%202.29%200%200%201%203.18%202.4c0%202.39-3.18%202.5-4.27%201.56s-.89-3.02%201.09-3.96z%22%20fill%3D%22%231d1d1b%22%2F%3E%3Cpath%20d%3D%22m49.7%2031.89a1.27%201.27%200%200%201%201.77%201.33c0%201.34-1.77%201.39-2.38.87a1.35%201.35%200%200%201%20.61-2.2z%22%20fill%3D%22%23ffffff%22%2F%3E%3Cpath%20d%3D%22m24.23%2044c1.18-.54%203.79.25%203.25%202.5s-3.16%201.62-4%20.91a2%202%200%200%201%20.75-3.41z%22%20fill%3D%22%231d1d1b%22%2F%3E%3Cpath%20d%3D%22m24.61%2044.74c.72-.33%202.33.15%202%201.54s-1.94%201-2.45.56a1.25%201.25%200%200%201%20.45-2.1z%22%20fill%3D%22%23ffffff%22%2F%3E%3Cpath%20d%3D%22m35.69%2042.86c.87-.32%201.67.79%203.54.25s4.04-1.41%205.77-1.11a2.37%202.37%200%200%201%202.29%201.91%205.43%205.43%200%200%201%20-.41%202.63%2033%2033%200%200%201%20-2.88%202.57c-.91.88-1.46%201.71-2.46%201.54s-1.7-.83-3.25-.87a7.12%207.12%200%200%201%20-3.08-.46c-.79-.37-2.42-1.75-2.33-2.75a6.37%206.37%200%200%201%202.81-3.71z%22%20fill%3D%22%231d1d1b%22%2F%3E%3Cpath%20d%3D%22m35.23%2044.53s.09%202.42.34%202.5.66.12.66-.08-.33-3%200-3.05.71.05.75.17-.08%203.13.25%203.17.67.16.67%200%200-3%200-3%20.5%200%20.58.12%200%203%20.34%203.09.66%200%20.66-.21a20.84%2020.84%200%200%201%20-.08-3.24c.17%200%201-.46%201-.29s0%202.41.21%202.41.83%200%20.83-.29-.21-2.21%200-2.33%201.17-.5%201.21-.33-.08%201.62.09%201.62.66%200%20.66-.29%200-1.54.17-1.58%202.25%200%202.5.54a3.89%203.89%200%200%201%20.12%202.16c-.16.25-1.79%201.42-2.54%202.34s-1.33%201.58-1.91%201.62-1.71-.71-2.67-.87-2.54%200-3.42-.42a2.22%202.22%200%200%201%20-1.37-1.58%204.7%204.7%200%200%201%20.95-2.18z%22%20fill%3D%22%23ffffff%22%2F%3E%3Cg%20fill%3D%22%231d1d1b%22%3E%3Cpath%20d%3D%22m36.32%2037.24c-.27-.18.79-.46%201-.29s1.55%203.37%201.25%203.58a2.28%202.28%200%200%201%20-1%20.21s-1.13-3.42-1.25-3.5z%22%2F%3E%3Cpath%20d%3D%22m37.82%2035.32c.14-.15.75-.62%201-.42a9.85%209.85%200%200%201%20.87%203.71c-.21.25-.91.42-1%20.17a24.72%2024.72%200%200%201%20-.87-3.46z%22%2F%3E%3Cpath%20d%3D%22m40.32%2034.49c.12-.17.7-.38.79-.09a14.94%2014.94%200%200%201%20.37%203.17c-.16.13-.79.42-.91.08a13.65%2013.65%200%200%201%20-.25-3.16z%22%2F%3E%3Cpath%20d%3D%22m45.77%2039.53c.14.13%203.15%202.14%203.15%202.67s-.06%201-.73.54a30.94%2030.94%200%200%201%20-3-2.29c0-.21.5-1%20.58-.92z%22%2F%3E%3Cpath%20d%3D%22m46%2037.7c-.05-.23.46-.63.71-.55s3.79%203.67%203.59%203.84-.42.5-.63.5a27%2027%200%200%201%20-3.67-3.79z%22%2F%3E%3Cpath%20d%3D%22m48.07%2036.65s.41-.7.75-.5%202.75%202.84%202.66%203.13-.54.79-.75.67-2.54-3.17-2.66-3.3z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";

// src/countdown.js

function createCountdownTimer(containerElement, { endTime }) {
  if (!containerElement) throw new Error("Must pass a container element.");
  if (!endTime) throw new Error("Must pass an endTime string.");

  const img = new Image();
  img.src = asteroidIconUrl;
  img.alt = "Asteroid icon";
  img.style.width = "30px";
  img.style.height = "30px";
  // Position it or draw it on a <canvas> as needed...
  containerElement.appendChild(img);

  const targetDate = new Date(endTime);

  // Create a wrapper div with a known class so CSS can target it
  const display = document.createElement("div");
  display.className = "countdown-timer";
  containerElement.appendChild(display);

  let timerId = null;

  function update() {
    const now = new Date();
    const diffMs = targetDate - now;

    if (diffMs <= 0) {
      display.textContent = "00 days 00:00:00";
      clearInterval(timerId);
      return;
    }

    const totalSeconds = Math.floor(diffMs / 1000);

    // Compute days, then remainder hours/minutes/seconds
    const days = Math.floor(totalSeconds / 86400); // 86400 = 24*3600
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Pad hours/minutes/seconds to always be two digits
    const hStr = String(hours).padStart(2, "0");
    const mStr = String(minutes).padStart(2, "0");
    const sStr = String(seconds).padStart(2, "0");

    display.innerHTML =
      `<span class="days">${days}</span>&nbsp;<b>day${
        days !== 1 ? "s" : ""
      }</b>&nbsp;<span class="digits">` +
      [
        `<span class="hours">${hStr}</span>`,
        `<span class="minutes">${mStr}</span>`,
        `<span class="seconds">${sStr}</span>`,
      ].join(":") +
      "</span>";
  }

  // Do one immediate update, then tick every second
  update();
  timerId = setInterval(update, 1000);

  return {
    destroy() {
      clearInterval(timerId);
      containerElement.removeChild(img);
      containerElement.removeChild(display);
    },
  };
}

const ASTEROIDS_GAME_ID = "asteroids-day-game";

function domReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

// Returns the next Asteroid Day (June 30) based on the current date.
function getNextAsteroidDay() {
  const today = new Date();
  const year = today.getFullYear();

  const thisYearJune30 = new Date(year, 5, 30);

  // If we’re still on or before June 30 of this year, return that.
  // Otherwise, return June 30 of next year.
  if (today <= thisYearJune30) {
    return thisYearJune30;
  } else {
    return new Date(year + 1, 5, 30);
  }
}

domReady(() => {
  const countdownContainer = document.getElementById("asteroid-day-countdown");
  if (!countdownContainer) {
    console.warn(
      "[AsteroidDay] no #asteroid-day-countdown element found; skipping auto-init."
    );
    return;
  }

  createCountdownTimer(countdownContainer, {
    endTime: getNextAsteroidDay().toISOString(),
  });

  let currentGame = null; // Track the current game instance
  countdownContainer.addEventListener("click", () => {
    // If a game already exists, don’t recreate it:
    if (currentGame) return;

    const gameContainer = document.createElement("div");
    const message = document.createElement("div");
    message.innerHTML = `
    	<div class="asteroid-day-message">
        <p>We proudly support humanity&rsquo;s efforts to protect the earth from asteroids.</p>
        <p><a href="https://asteroidday.org/">Learn more about Asteroid Day</a></p>
      </div>
    `;
    const gameDiv = document.createElement("div");
    gameContainer.id = ASTEROIDS_GAME_ID + "-container";
    gameDiv.id = ASTEROIDS_GAME_ID;
    gameContainer.appendChild(gameDiv);
    gameContainer.appendChild(message);
    document.body.appendChild(gameContainer);

    currentGame = createAsteroidsGame(gameDiv, {});

    function endGame() {
      currentGame.end();
      currentGame = null;

      // Clean up
      document.body.removeChild(gameContainer);
      document.removeEventListener("click", onDocumentClick, true);
      document.removeEventListener("keyup", onEscapeKey, true);
    }

    function onDocumentClick(evt) {
      // If the click target is inside gameDiv, ignore
      if (gameDiv.contains(evt.target)) return;
      if (message === evt.target || message.contains(evt.target)) return;
      endGame();
    }

    function onEscapeKey(evt) {
      // If Escape key pressed, end the game
      if (evt.key === "Escape") {
        endGame();
      }
    }

    document.addEventListener("keyup", onEscapeKey, true);
    document.addEventListener("click", onDocumentClick, true);
  });
});

export { createAsteroidsGame, createCountdownTimer };
//# sourceMappingURL=asteroid-day.esm.js.map
