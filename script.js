// Perlin Noise
!function (n, r) { "object" == typeof exports && "undefined" != typeof module ? module.exports = r() : "function" == typeof define && define.amd ? define(r) : (n = n || self).perlinNoise3d = r() }(this, function () { return perlinNoise3d = function () { for (var n = Math.floor(720), r = new Array(n), e = new Array(n), t = Math.PI / 180, i = 0; i < n; i++)r[i] = Math.sin(i * t * .5), e[i] = Math.cos(i * t * .5); var o = n; o >>= 1; var l = function () { this.perlin_octaves = 4, this.perlin_amp_falloff = .5, this.perlin = null }; return l.prototype = { noiseSeed: function (n) { var r = function () { var n, r, e = 4294967296; return { setSeed: function (t) { r = n = (null == t ? Math.random() * e : t) >>> 0 }, getSeed: function () { return n }, rand: function () { return (r = (1664525 * r + 1013904223) % e) / e } } }(); r.setSeed(n), this.perlin = new Array(4096); for (var e = 0; e < 4096; e++)this.perlin[e] = r.rand(); return this }, get: function (r, t, i) { if (t = t || 0, i = i || 0, null == this.perlin) { this.perlin = new Array(4096); for (var l = 0; l < 4096; l++)this.perlin[l] = Math.random() } r < 0 && (r = -r), t < 0 && (t = -t), i < 0 && (i = -i); for (var f, a, s, h, p, u = Math.floor(r), d = Math.floor(t), c = Math.floor(i), v = r - u, M = t - d, y = i - c, m = 0, _ = .5, w = function (r) { return .5 * (1 - e[Math.floor(r * o) % n]) }, A = 0; A < this.perlin_octaves; A++) { var S = u + (d << 4) + (c << 8); f = w(v), a = w(M), s = this.perlin[4095 & S], s += f * (this.perlin[S + 1 & 4095] - s), h = this.perlin[S + 16 & 4095], s += a * ((h += f * (this.perlin[S + 16 + 1 & 4095] - h)) - s), h = this.perlin[4095 & (S += 256)], h += f * (this.perlin[S + 1 & 4095] - h), p = this.perlin[S + 16 & 4095], h += a * ((p += f * (this.perlin[S + 16 + 1 & 4095] - p)) - h), m += (s += w(y) * (h - s)) * _, _ *= this.perlin_amp_falloff, u <<= 1, d <<= 1, c <<= 1, (v *= 2) >= 1 && (u++, v--), (M *= 2) >= 1 && (d++, M--), (y *= 2) >= 1 && (c++, y--) } return m } }, l }() });
let perlin = new perlinNoise3d();
perlin.noiseSeed(Math.random());

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

let areLasersNear = false;
let playerDead = false;
let kills = 0;
let score = 0;
let infos = []

class Laser {
    constructor(x, y, angle, color, type) {
        this.dx = Math.cos(angle);
        this.dy = Math.sin(angle);
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
    }

    update(delta) {
        this.x += this.dx * 500 * delta * (this.type == 'player' ? 2 : 1);
        this.y += this.dy * 500 * delta * (this.type == 'player' ? 2 : 1);
        if (distance2d(this.x, this.y, x, y) < 70 && this.type == 'enemy') {
            areLasersNear = true;
        }
    }

    draw(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2 + 10 ** timeSincePlayerDeath;
        let length = 7 + 10 ** (timeSincePlayerDeath * 3);
        ctx.beginPath();
        ctx.moveTo(this.x - this.dx * length, this.y - this.dy * length);
        ctx.lineTo(this.x + this.dx * length, this.y + this.dy * length);
        ctx.stroke();
    }
}

class Fragment {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.angle = Math.random() * Math.PI * 2;
        this.dx = Math.cos(this.angle) * (Math.random() * 1 + .5) * 300;
        this.dy = Math.sin(this.angle) * (Math.random() * 1 + .5) * 300;
        this.lifetime = 5;
        this.color = color;
    }

    update(delta) {
        this.x += this.dx * delta;
        this.y += this.dy * delta;
        this.lifetime -= delta;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    }
}

let streak = 0, lastKill = 0;

class Ship {
    constructor(x, y, isBig) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.cooldown = 2;
        this.isBig = isBig;
        this.count = 0;
    }

    update(delta) {
        if (this.dead) {
            this.timeSinceDeath += delta;
            this.timeSinceDeath += this.timeSinceDeath;
        } else {
            let angle = Math.atan2(y - this.y, x - this.x);
            let movementX = Math.cos(angle);
            let movementY = Math.sin(angle);
            this.vx += movementX * delta;
            this.vy += movementY * delta;
            this.vx /= 1 + delta;
            this.vy /= 1 + delta;
            this.x += this.vx * delta * 120;
            this.y += this.vy * delta * 120;
            this.cooldown -= delta;
            if (this.cooldown <= 0) {
                if (this.isBig) {
                    this.count++;
                    this.cooldown = this.count < 3 ? 0.1 : 1.5;
                    if (this.count == 3) {
                        this.count = 0;
                    }
                    lasers.push(new Laser(this.x - 10, this.y, angle, '#f00', 'enemy'));
                    lasers.push(new Laser(this.x, this.y, angle, '#f00', 'enemy'));
                    lasers.push(new Laser(this.x + 10, this.y, angle, '#f00', 'enemy'));
                } else {
                    this.cooldown = 2;
                    lasers.push(new Laser(this.x, this.y, angle, this.isBig ? '#f00' : '#0f0', 'enemy'));
                }
            }
        }
    }

    draw(ctx) {
        let angle = Math.atan2(this.vy, this.vx);
        ctx.fillStyle = this.isBig ? 'blue ' : 'darkblue';
        ctx.globalAlpha = this.dead ? Math.min(1 / (1 + this.timeSinceDeath * 2), 1) : 1;
        ctx.beginPath();
        ctx.moveTo(this.x + Math.cos(angle) * 15, this.y + Math.sin(angle) * 15);
        ctx.lineTo(this.x + Math.cos(angle + Math.PI - Math.PI / 5) * 20 * (this.dead ? (this.timeSinceDeath + 1) : 1), this.y + Math.sin(angle + Math.PI - Math.PI / 5) * 20 * (this.dead ? (this.timeSinceDeath + 1) : 1));
        let pointAngle1 = Math.atan2(0, -30);
        let distance1 = 30 + this.cooldown * 20;
        pointAngle1 += angle;
        let dx = Math.cos(pointAngle1) * distance1;
        let dy = Math.sin(pointAngle1) * distance1;
        if (this.dead) {
            dx *= this.timeSinceDeath + 1;
            dy *= this.timeSinceDeath + 1;
        }
        ctx.lineTo(this.x + Math.cos(angle + Math.PI - Math.PI / 5) * 20 * (this.dead ? (this.timeSinceDeath + 1) : 1) + dx, this.y + Math.sin(angle + Math.PI - Math.PI / 5) * 20 * (this.dead ? (this.timeSinceDeath + 1) : 1) + dy);
        ctx.lineTo(this.x + Math.cos(angle + Math.PI + Math.PI / 5) * 20 * (this.dead ? (this.timeSinceDeath + 1) : 1) + dx, this.y + Math.sin(angle + Math.PI + Math.PI / 5) * 20 * (this.dead ? (this.timeSinceDeath + 1) : 1) + dy);
        ctx.lineTo(this.x + Math.cos(angle + Math.PI + Math.PI / 5) * 20 * (this.dead ? (this.timeSinceDeath + 1) : 1), this.y + Math.sin(angle + Math.PI + Math.PI / 5) * 20 * (this.dead ? (this.timeSinceDeath + 1) : 1));
        ctx.closePath();
        for (let i = 0; i < lasers.length; i++) {
            if (!this.dead && lasers[i].type == 'player' && ctx.isPointInPath(lasers[i].x + 250 - x, lasers[i].y + 250 - y)) {
                this.dead = true;
                kills++;
                score += 10;
                if (this.isBig) {
                    score += 40;
                    infos.push([`+40`, 0, this.x, this.y - 20]);
                }
                let now = Date.now();
                if (now - lastKill > 2000) {
                    streak = 1;
                } else {
                    streak++;
                    if (streak > 1) {
                        infos.push([`X${streak} +${streak * 7}`, 0, this.x, this.y - 20]);
                        score += streak * 7;
                    }
                }
                lastKill = now;
                this.timeSinceDeath = 0;
                for (let X = -30; X < 30; X++) {
                    for (let Y = -30; Y < 30; Y++) {
                        if (ctx.isPointInPath(this.x + X + 250 - x, this.y + Y + 250 - y)) {
                            fragments.push(new Fragment(this.x + X, this.y + Y, this.isBig ? 'blue' : 'darkblue'));
                        }
                    }
                }
            }
        }
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

let x = 0;
let y = 0;
let dx = 0;
let dy = 0;
let shoot = false;
let cooldown = 0.5;

let mouseX = 0, mouseY = 0;
canvas.addEventListener('click', e => {
    if (!document.pointerLockElement) {
        canvas.requestPointerLock();
        if (e.altKey) canvas.requestFullscreen();
    } else {
        shoot = true;
    }
});

canvas.addEventListener('mousemove', e => {
    if (document.pointerLockElement) {
        mouseX += e.movementX;
        mouseY += e.movementY;

        // if (Math.sqrt(mouseX ** 2 + mouseY ** 2) > 100) {
        // let direction = Math.atan2(mouseY, mouseX);
        // mouseX = Math.cos(direction) * 100;
        // mouseY = Math.sin(direction) * 100;
        // }
    }
});

let keys = {
    space: true
};

addEventListener('keydown', e => {
    if (e.key == ' ') keys.space = false;
});

addEventListener('keyup', e => {
    if (e.key == ' ') keys.space = true;
});

let ships = [], lasers = [], fragments = [];

let time = Date.now();

let q = 5;
let timeUntilBigger = 0;
let requiredKills = 4;

let distance2d = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

let timeSincePlayerDeath = 0;

function step() {
    // if (playerDead) {
    // setTimeout(() => requestAnimationFrame(step), Math.floor(timeSincePlayerDeath * 1000));
    // } else {
    if (timeSincePlayerDeath < 1.1) {
        requestAnimationFrame(step);
    } else {
        let fn = () => {
            let delta;
            let now = Date.now();
            let delay = now - time;
            time = now;
            delta = delay / 1000;
            timeSincePlayerDeath -= delta;
            canvas.style.filter = `blur(${Math.log10(Math.max(timeSincePlayerDeath, 0.0001) + 0.65) * 80}px)`
            ctx.globalAlpha = 0.07 + Math.log10(Math.max(timeSincePlayerDeath, 0.0001) + 0.65) * 0.03;
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `35px "DIN 1451"`;
            ctx.fillText(`SCORE`, canvas.width / 2, canvas.height / 2 - 50);
            ctx.font = `60px "DIN 1451"`;
            ctx.fillText(`${score}`, canvas.width / 2, canvas.height / 2);
            requestAnimationFrame(fn);
        };
        requestAnimationFrame(fn);
    }
    // }
    let delta;
    let now = Date.now();
    let delay = now - time;
    time = now;
    delta = delay / 1000;

    if (playerDead) {
        delta /= 1 + (timeSincePlayerDeath * 5);
        if (timeSincePlayerDeath < 1.1) {
            canvas.style.filter = `blur(${Math.log10(timeSincePlayerDeath + 0.65) * 80}px)`;
        }
    }

    areLasersNear = false;
    if (playerDead) {
        timeSincePlayerDeath += delta;
    }

    q += delta;
    if (q > 5) {
        let isBig = false;
        if (kills >= requiredKills && timeUntilBigger < 0) {
            timeUntilBigger = 23;
            isBig = true;
        }
        ships.push(new Ship(Math.random() * 800 - 400 + x, Math.random() * 800 - 400 + y, isBig));
        q = 0;
    }
    cooldown -= delta;
    if (shoot && cooldown <= 0) {
        cooldown = 0.5;
        lasers.push(new Laser(x, y, Math.atan2(mouseY, mouseX), '#00ffdd', 'player'));
    }
    shoot = false;

    if (kills > 5) {
        timeUntilBigger -= delta;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-x + 250, -y + 250);

    let gridSize = 10;
    for (let i = Math.floor((x - 250 + 5) / gridSize) * gridSize; i < Math.floor((x + 250) / gridSize) * gridSize; i += gridSize) {
        for (let j = Math.floor((y - 250 + 5) / gridSize) * gridSize; j < Math.floor((y + 250) / gridSize) * gridSize; j += gridSize) {
            // alert(i + ' ' + j);
            let u = i;
            let v = j;
            // u /= 17.84;
            // v /= 17.84;
            // ctx.fillText(u + ' ' + v, i , j );
            if (perlin.get(u, v) > 0.8) {
                let size = 3;
                ctx.fillStyle = 'white';
                ctx.fillRect(i - size / 2, j - size / 2, size, size);
            }
        }
    }
    // ctx.fillRect(mouseX + 240, mouseY + 240, 10, 10);
    for (let i = 0; i < ships.length; i++) {
        if (!playerDead) {
            ships[i].update(delta);
        }
        ships[i].draw(ctx);
        if (ships[i].dead && ships[i].timeSinceDeath > 3) {
            ships.splice(i, 1);
            i--;
        }
    }

    outer: for (let i = 0; i < lasers.length; i++) {
        lasers[i].update(delta);
        lasers[i].draw(ctx);
        if (distance2d(lasers[i].x, lasers[i].y, x, y) > 1000) {
            for (let j = 0; j < ships.length; j++) {
                if (distance2d(lasers[i].x, lasers[i].y, x, y) < 1000) {
                    continue outer;
                }
            }
            lasers.splice(i, 1);
            i--;
        }
    }

    for (let i = 0; i < fragments.length; i++) {
        fragments[i].update(delta);
        fragments[i].draw(ctx);
        if (distance2d(fragments[i].x, fragments[i].y, x, y) > 1000 || fragments[i].lifetime < 0) {
            fragments.splice(i, 1);
            i--;
        }
    }

    let angle = Math.atan2(mouseY, mouseX);

    ctx.fillStyle = 'purple';
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * 20, y + Math.sin(angle) * 20);
    ctx.lineTo(x + Math.cos(angle + Math.PI - Math.PI / 5) * 20, y + Math.sin(angle + Math.PI - Math.PI / 5) * 20);
    ctx.lineTo(x + Math.cos(angle + Math.PI + Math.PI / 5) * 20, y + Math.sin(angle + Math.PI + Math.PI / 5) * 20);
    ctx.closePath();
    for (let i = 0; i < lasers.length; i++) {
        if (!playerDead && lasers[i].type == 'enemy' && ctx.isPointInPath(lasers[i].x + 250 - x, lasers[i].y + 250 - y)) {
            playerDead = true;
            for (let X = -30; X < 30; X++) {
                for (let Y = -30; Y < 30; Y++) {
                    if (ctx.isPointInPath(X + 250, Y + 250)) {
                        fragments.push(new Fragment(x + X, y + Y, 'purple'));
                    }
                }
            }
        }
    }
    if (!playerDead) ctx.fill();

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    for (let i = 0; i < infos.length; i++) {
        ctx.globalAlpha = 1 - (infos[i][1] / 25);
        ctx.font = `${15 + infos[i][1]}px "DIN 1451"`;
        ctx.fillText(infos[i][0], infos[i][2], infos[i][3] - infos[i][1] * 1.3);
        infos[i][1] += delta * 40;
        if (infos[i][1] > 25) {
            infos.splice(i, 1);
            i--;
        }
        ctx.globalAlpha = 1;
    }

    ctx.restore();

    ctx.strokeStyle = areLasersNear ? '#ff3333' : '#dd333388';
    ctx.lineWidth = 3 + 10 ** timeSincePlayerDeath;
    ctx.beginPath();
    ctx.arc(250, 250, 100, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = areLasersNear ? '#ff0000' : '#dd3333';
    ctx.lineWidth = 5 + 10 ** timeSincePlayerDeath;
    ctx.beginPath();
    ctx.arc(250, 250, 100, angle - Math.PI / 40, angle + Math.PI / 40);
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.fillRect((250 + mouseX - (10)) | 0, (250 + mouseY) | 0, 20, 1);
    ctx.fillRect((250 + mouseX) | 0, (250 + mouseY - (10)) | 0, 1, 20);
    ctx.font = '15px "DIN 1451"';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE ${score}`, 495, 20);
    if (!playerDead) {
        let movementX = Math.cos(angle) * (keys.space ? 2 : 1);
        let movementY = Math.sin(angle) * (keys.space ? 2 : 1);
        dx += movementX * (keys.space ? delta * 2 : delta);
        dy += movementY * (keys.space ? delta * 2 : delta);
        dx /= 1 + (keys.space ? delta * 2 : delta);
        dy /= 1 + (keys.space ? delta * 2 : delta);
        // if (keys.space) {
        // dx = movementX;
        // dy = movementY;
        // }
        x += dx * delta * 170;
        y += dy * delta * 170;
    }
}

step();