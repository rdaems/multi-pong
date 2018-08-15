window.onload = function () {
    document.body.appendChild(canvas);
    update_scores()
    animate(step);
};

var step = function () {
    update();
    render();
    animate(step);
};

var update = function () {
    for (var i = 0; i < players.length; ++i) {
        players[i].update();
    }
    ball.update();
};

var render = function () {
    context.fillStyle = '#3f8253';
    context.fillRect(0, 0, width, height);
    wall.render();
    for (var i = 0; i < players.length; ++i) {
        players[i].render();
    }
    ball.render();
};

function Paddle() {
    this.phi = 0;
    this.width = 0;
}

Paddle.prototype.render = function () {
    context.strokeStyle = "#0000FF";
    context.beginPath();
    context.arc(origin_x, origin_y, game_radius, this.phi - this.width / 2, this.phi + this.width / 2);
    context.stroke();
};

Paddle.prototype.check = function (phi) {
    phi_d = (phi - this.phi - this.width / 2) % (2 * Math.PI);
    return (phi_d < (this.phi + this.width % (2 * Math.PI)));
};

function Player(name, mode) {
    this.name = name
    if (mode == 'human') {
        this.control = keyboard
    } else if (mode == 'ai') {
        this.control = ai
    }
    this.paddle = new Paddle();
};

Player.prototype.update = function () {
    for (var key in keysDown) {
        var value = Number(key);
        if (value == 37) { // left arrow
            this.paddle.move(- 0.01);
        } else if (value == 39) { // right arrow
            this.paddle.move(0.01);
        }
    }
};

Player.prototype.render = function () {
    this.paddle.render();
};

function Computer() {
    this.paddle = new Paddle(175, 10, 50, 10);
}

Computer.prototype.render = function () {
    this.paddle.render();
};

function Ball(x, y, radius) {
    this.x = x;
    this.y = y;
    this.x_v = 0;
    this.y_v = 0;
    this.radius = radius;
};

Ball.prototype.get_polar = function () {
    var x = this.x - origin_x;
    var y = this.y - origin_y;
    var r = Math.sqrt(x * x + y * y)
    var phi = Math.atan2(y, x)
    return [r, phi]
};


Ball.prototype.render = function () {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 2 * Math.PI, false);
    context.fillStyle = "#000000";
    context.fill();
};

Ball.prototype.update = function () {
    var x_a, y_a;
    var polar = this.get_polar();
    var r = polar[0];
    var phi = polar[1];

    var dr = r + this.radius - game_radius;

    if (dr > 0) {
        segment = wall.get_segment(phi);
        if (segment.mode) {
            var a = dr * dr * k_wall;
        } else {
            // check goal
            if (dr > goal_offset) {
                scores[paddle.player_id] += 1;
                update_scores();
            }
            paddle = players[segment.player_id].paddle;
            if (paddle.check(phi)) {
                var a = dr * dr * k_paddle;
            }
        }
        x_a = - a * (this.x - origin_x) / r;
        y_a = - a * (this.y - origin_y) / r;
    } else {
        x_a = 0;
        y_a = 0;
    }

    this.x_v += x_a * dt;
    this.y_v += y_a * dt;
    this.x += this.x_v * dt;
    this.y += this.y_v * dt;
};

Paddle.prototype.move = function (dphi) {
    this.phi += dphi;

    // todo: check goal endings
};

Computer.prototype.update = function (ball) {
    var x_pos = ball.x;
    var diff = -((this.paddle.x + (this.paddle.width / 2)) - x_pos);
    if (diff < 0 && diff < -4) { // max speed left
        diff = -5;
    } else if (diff > 0 && diff > 4) { // max speed right
        diff = 5;
    }
    this.paddle.move(diff, 0);
    if (this.paddle.x < 0) {
        this.paddle.x = 0;
    } else if (this.paddle.x + this.paddle.width > 400) {
        this.paddle.x = 400 - this.paddle.width;
    }
};

function Segment(begin, end, mode, player_id) {
    // begin, end: [rad], mode: {0: goal, 1: wall}
    this.begin = begin;
    this.end = end;
    this.mode = mode;
    this.player_id = player_id;
}

Segment.prototype.render = function () {
    context.strokeStyle = "#FFFFFF";
    context.beginPath();
    context.arc(origin_x, origin_y, game_radius, this.begin, this.end);
    context.stroke();
};

Segment.prototype.check = function (phi) {
    phi_d = (phi - this.begin) % (2 * Math.PI);
    return (phi_d < (this.end % (2 * Math.PI)));
}

function Wall(segment_weights) {
    this.segment_weights = segment_weights;
    var total_weight = this.segment_weights.reduce((a, b) => a + b, 0);
    var num_segments = this.segment_weights.length;
    this.segments = new Array(num_segments);
    var begin = 0;
    var end = 0;
    for (var i = 0; i <= num_segments; ++i) {
        var mode = i % 2;
        if (mode) {
            var player_id = - 1;
        } else {
            var player_id = Math.floor(i / 2);
        }

        end = begin + segment_weights[i] / total_weight * 2 * Math.PI;
        this.segments[i] = new Segment(begin, end, mode, player_id);
        begin = end;
    }
}

Wall.prototype.get_segment = function(phi) {
    for (var i=0;i<this.segments.length;++i) {
        if (this.segments[i].check(phi)) {
            return this.segments[i];
        }
    }
};

Wall.prototype.render = function () {
    for (var i = 0; i < this.segments.length; ++i) {
        if (this.segments[i].mode) {
            this.segments[i].render();
        }
    }
}

function keyboard() {

}


function ai() {

}

function get_region(phi) {

}

function update_scores() {
    document.getElementById('score-header').innerText = 'Computer: ' + scores[0] + ' | ' + player.name + ': ' + scores[1]

    // check if score == 10
    if (scores[0] == 10) {
        alert('Computer has won!');
    } else if (scores[1] == 10) {
        alert(player.name + ' has won!');
    }
};

var dt = 1 / 60;
var k_wall = 500;
var k_paddle = 500;
var game_radius = 200;
var goal_offset = 50;
var width = 500;
var height = 500;
var origin_x = 250;
var origin_y = 250;
var players = [new Player('Tille', 'human'), new Player('Rembert', 'ai'), new Player('PC', 'ai')]
var player = players[0];
var computer = players[2];
var num_players = players.length
for (var i = 0; i < num_players; ++i) {
    players[i].paddle.phi = 2 * Math.PI * (i + 1 / 4) / num_players;
    players[i].paddle.width = Math.PI / 16;
}
var ball = new Ball(origin_x, origin_y + 50, 5);
v0 = 200;
phi0 = 0.5;
ball.x_v = v0 * Math.cos(phi0);
ball.y_v = v0 * Math.sin(phi0);
var wall = new Wall([1, 1, 1, 1, 1, 1]);
var scores = [0, 0] // computer, player

var keysDown = {};

window.addEventListener("keydown", function (event) {
    keysDown[event.keyCode] = true;
});

window.addEventListener("keyup", function (event) {
    delete keysDown[event.keyCode];
});

var animate = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) { window.setTimeout(callback, 1000 * dt) };

var canvas = document.createElement('canvas');
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');
