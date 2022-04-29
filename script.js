// Perlin Noise
!function (n, r) { "object" == typeof exports && "undefined" != typeof module ? module.exports = r() : "function" == typeof define && define.amd ? define(r) : (n = n || self).perlinNoise3d = r() }(this, function () { return perlinNoise3d = function () { for (var n = Math.floor(720), r = new Array(n), e = new Array(n), t = Math.PI / 180, i = 0; i < n; i++)r[i] = Math.sin(i * t * .5), e[i] = Math.cos(i * t * .5); var o = n; o >>= 1; var l = function () { this.perlin_octaves = 4, this.perlin_amp_falloff = .5, this.perlin = null }; return l.prototype = { noiseSeed: function (n) { var r = function () { var n, r, e = 4294967296; return { setSeed: function (t) { r = n = (null == t ? Math.random() * e : t) >>> 0 }, getSeed: function () { return n }, rand: function () { return (r = (1664525 * r + 1013904223) % e) / e } } }(); r.setSeed(n), this.perlin = new Array(4096); for (var e = 0; e < 4096; e++)this.perlin[e] = r.rand(); return this }, get: function (r, t, i) { if (t = t || 0, i = i || 0, null == this.perlin) { this.perlin = new Array(4096); for (var l = 0; l < 4096; l++)this.perlin[l] = Math.random() } r < 0 && (r = -r), t < 0 && (t = -t), i < 0 && (i = -i); for (var f, a, s, h, p, u = Math.floor(r), d = Math.floor(t), c = Math.floor(i), v = r - u, M = t - d, y = i - c, m = 0, _ = .5, w = function (r) { return .5 * (1 - e[Math.floor(r * o) % n]) }, A = 0; A < this.perlin_octaves; A++) { var S = u + (d << 4) + (c << 8); f = w(v), a = w(M), s = this.perlin[4095 & S], s += f * (this.perlin[S + 1 & 4095] - s), h = this.perlin[S + 16 & 4095], s += a * ((h += f * (this.perlin[S + 16 + 1 & 4095] - h)) - s), h = this.perlin[4095 & (S += 256)], h += f * (this.perlin[S + 1 & 4095] - h), p = this.perlin[S + 16 & 4095], h += a * ((p += f * (this.perlin[S + 16 + 1 & 4095] - p)) - h), m += (s += w(y) * (h - s)) * _, _ *= this.perlin_amp_falloff, u <<= 1, d <<= 1, c <<= 1, (v *= 2) >= 1 && (u++, v--), (M *= 2) >= 1 && (d++, M--), (y *= 2) >= 1 && (c++, y--) } return m } }, l }() });
let perlin = new perlinNoise3d();
perlin.noiseSeed(Math.random());

// let o = Date.now; Date.now = () => o() / 5;

const canvas = document.querySelector('#main');
const colorCanvas = document.querySelector('#color');
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');
/** @type {CanvasRenderingContext2D} */
const colorCtx = colorCanvas.getContext('2d');

let areLasersNear = false;
let nearestLaser = Infinity;
let playerDead = false;
let shouldGiveShield = true;
let kills = 0;
let score = 0;
let infos = [];
let shieldCount = 0;

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
        let dist = distance2d(this.x, this.y, x, y);
        if (dist < 70 && this.type == 'enemy') {
            areLasersNear = true;
            if (shieldCount > 0) {
                fragments.push(new Fragment(this.x, this.y, '#ff6611', Math.atan2(this.y - y, this.x - x)));
            }
            if (dist < nearestLaser) nearestLaser = dist;
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
    constructor(x, y, color, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle || (Math.random() * Math.PI * 2);
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
        if (dashThisFrame) {
            let amountOfMovement = 1000 * 0.35;
            let dx = Math.cos(dashAngle);
            let dy = Math.sin(dashAngle);
            let dashX = x;
            let dashY = y;
            for (let i = 0; i < amountOfMovement; i += 1.5) {
                if (ctx.isPointInPath(dashX + 250 - x, dashY + 250 - y) || ctx.isPointInPath(dashX + 5 + 250 - x, dashY + 250 - y) || ctx.isPointInPath(dashX + 250 - x, dashY + 5 + 250 - y) || ctx.isPointInPath(dashX - 5 + 250 - x, dashY + 250 - y) || ctx.isPointInPath(dashX + 250 - x, dashY - 5 + 250 - y)) {
                    this.shouldDie = true;
                }
                dashX += dx * 1.5;
                dashY += dy * 1.5;
            }
        }
        for (let i = 0; i < lasers.length; i++) {
            if (!this.dead && lasers[i].type == 'player' && ctx.isPointInPath(lasers[i].x + 250 - x, lasers[i].y + 250 - y) || this.shouldDie) {
                this.shouldDie = false;
                this.dead = true;
                kills++;
                score += 10;
                if (this.isBig) {
                    if (shouldGiveShield) {
                        shouldGiveShield = false;
                        shieldCount++;
                    } else {
                        shouldGiveShield = true;
                    }
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
let dashCooldown = 0;

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
let dashAngle, displayCooldownTime;

addEventListener('keydown', e => {
    // if (e.key == ' ') keys.space = false;
    if (e.key == ' ') {
        if (dashCooldown <= 0) {
            dashCooldown = 4;
            enteredDash = true;
            timeInDash = 0;
            dashAngle = Math.atan2(mouseY, mouseX);
            dashThisFrame = true;
            displayCooldown = true;
            displayCooldownTime = 0.85;
        } else {
            displayCooldown = true;
            displayCooldownTime = 0.85;
        }
    }
});

addEventListener('keyup', e => {
    // if (e.key == ' ') keys.space = true;
    
});

let ships = [], lasers = [], fragments = [];
let enteredDash = false, timeInDash = 0, dashThisFrame = false;

let time = Date.now();

let q = 5;
let timeUntilBigger = 0;
let requiredKills = 4;

let distance2d = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

let timeSincePlayerDeath = 0;
let isEditorOpen = false;
let displayCooldown = false;

let spawnRate = 5;

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
    let doUpdate = !isEditorOpen && !enteredDash;

    if (playerDead) {
        delta /= 1 + (timeSincePlayerDeath * 5);
        if (timeSincePlayerDeath < 1.1) {
            canvas.style.filter = `blur(${Math.log10(timeSincePlayerDeath + 0.65) * 80}px)`;
        }
    }

    areLasersNear = false;
    nearestLaser = Infinity;
    if (playerDead) {
        timeSincePlayerDeath += delta;
    }

    timeInDash += delta;
    if (timeInDash > 0.35) {
        enteredDash = false;
    }

    if (doUpdate) {
        dashCooldown -= delta;
        displayCooldownTime -= delta;
        q += delta;
        spawnRate -= delta / (100 / spawnRate);
        if (q > spawnRate) {
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
            cooldown = spawnRate / 10;
            lasers.push(new Laser(x, y, Math.atan2(mouseY, mouseX), '#00ffdd', 'player'));
        }
        shoot = false;

        if (kills > 5) {
            timeUntilBigger -= delta;
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ctx.fillStyle = 'black';
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

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
        if (!playerDead && doUpdate) {
            ships[i].update(delta);
        }
        ships[i].draw(ctx);
        if (ships[i].dead && ships[i].timeSinceDeath > 3) {
            ships.splice(i, 1);
            i--;
        }
    }

    outer: for (let i = 0; i < lasers.length; i++) {
        if (doUpdate) {
            lasers[i].update(delta);
        }
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
        if (doUpdate) {
            fragments[i].update(delta);
        }
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
            if (shieldCount > 0) {
                shieldCount--;
                for (let i = 0; i < Math.PI * 2; i += Math.PI / 100) {
                    fragments.push(new Fragment(x + Math.cos(i) * 70, y + Math.sin(i) * 70, '#ff6611', i));
                }
                lasers.splice(i, 1);
                i--;
                continue;
            }
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

    if (shieldCount > 0 && areLasersNear) {
        ctx.globalAlpha = 1 - (nearestLaser / 70);
        ctx.strokeStyle = '#ff6611';
        ctx.beginPath();
        ctx.arc(250, 250, 70, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    for (let i = 0; i < ships.length; i++) {
        ctx.strokeStyle = ships[i].isBig ? '#0000ff88' : '#00009988';
        ctx.lineWidth = 5 + 10 ** timeSincePlayerDeath;
        let angle = Math.atan2(ships[i].y - y, ships[i].x - x);
        ctx.beginPath();
        ctx.arc(250, 250, 100, angle - Math.PI / 40, angle + Math.PI / 40);
        ctx.stroke();
    }

    ctx.fillStyle = 'white';
    ctx.fillRect((250 + mouseX - (10)) | 0, (250 + mouseY) | 0, 20, 1);
    ctx.fillRect((250 + mouseX) | 0, (250 + mouseY - (10)) | 0, 1, 20);
    ctx.font = '15px "DIN 1451"';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE ${score} SR ${spawnRate.toFixed(2)}`, 495, 20);
    if (shieldCount > 0) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ff6611';
        ctx.fillText(`X ${shieldCount}`, 5, 20);
    }
    if (displayCooldown) {
        if (dashCooldown < 0) {
            displayCooldown = false;
        } else {
            ctx.save();
            ctx.translate(250, 300);
            ctx.rotate(Math.random() * Math.PI / 25 - Math.PI / 50);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 4;
            ctx.strokeRect(-50, -10, 100, 20);
            ctx.fillStyle = 'white';
            ctx.fillRect(-48, -8, 96 * (1 - (dashCooldown / 4)), 16);
            ctx.restore();
        }
    }
    if (!playerDead && doUpdate) {
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

    if (enteredDash) {
        let amount = timeInDash > 0.175 ? (0.35 - timeInDash) : timeInDash;
        let data = ctx.getImageData(0, 0, 500, 500);
        let data2 = colorCtx.createImageData(500, 500);
        let distance = -Math.sin(amount * (1 / 0.175) * Math.PI * 2) * 12;
        let translateX = Math.cos(dashAngle + Math.PI / 2) * distance;
        let translateY = Math.sin(dashAngle + Math.PI / 2) * distance;
        for (let i = 0; i < data.data.length; i += 4) {
            data2.data[i] = 0;
            data2.data[i + 1] = data.data[i + 1];
            data2.data[i + 2] = 0;
            data2.data[i + 3] = data.data[i + 3] * 0.8;
        }
        ctx.putImageData(data2, 0, 0);
        for (let i = 0; i < data.data.length; i += 4) {
            data2.data[i] = data.data[i];
            data2.data[i + 1] = 0;
            data2.data[i + 2] = 0;
            data2.data[i + 3] = data.data[i + 3];
        }
        colorCtx.putImageData(data2, 0, 0);
        ctx.globalAlpha = 0.8;
        ctx.drawImage(colorCanvas, -translateX, -translateY);
        for (let i = 0; i < data.data.length; i += 4) {
            data2.data[i] = 0;
            data2.data[i + 1] = 0;
            data2.data[i + 2] = data.data[i + 2];
        }
        colorCtx.putImageData(data2, 0, 0);
        ctx.drawImage(colorCanvas, translateX, translateY);
        ctx.globalAlpha = 1;
        let dx = Math.cos(dashAngle);
        let dy = Math.sin(dashAngle);
        x += dx * delta * 1000;
        y += dy * delta * 1000;
    }
    // let imageData = ctx.getImageData(0, 0, 500, 500);
    // let data = imageData.data;
    // let otherImageData = ctx.getImageData(0, 0, 500, 500);
    // let otherData = otherImageData.data;
    /*for (let x = 10; x < 490; x += 1) {
        // break;
        for (let y = 10; y < 490; y += 3) {
            let index = (x + y * 500) * 4;
            let r = data[index];
            let g = data[index + 1];
            let b = data[index + 2];
            let a = data[index + 3];
            if (a != 255) {
                for (let u = -4; u < 5; u++) {
                    for (let v = -9; v < 10; v++) {
                        let index_ = ((x + u) + (y + v) * 500) * 4;
                        if (otherData[index_ + 3] > 0) {
                            r += otherData[index_] / (Math.sqrt(u * u + v * v) + 40);
                            g += otherData[index_ + 1] / (Math.sqrt(u * u + v * v) + 40);
                            b += otherData[index_ + 2] / (Math.sqrt(u * u + v * v) + 40);
                            a += otherData[index_ + 3] / (Math.sqrt(u * u + v * v) + 40);
                        }
                    }
                }
            }
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
            data[index + 3] = a;
        }
    }*/
    // ctx.putImageData(imageData, 0, 0);
    dashThisFrame = false;
}

step();