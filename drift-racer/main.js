class Input {
  constructor() {
    this.keys = {};
    window.addEventListener("keydown", e => this.keys[e.key] = true);
    window.addEventListener("keyup", e => this.keys[e.key] = false);
  }
}

class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.smoothness = 0.08;
  }

  follow(target) {
    this.x += (target.x - this.x) * this.smoothness;
    this.y += (target.y - this.y) * this.smoothness;
  }
}

class Car {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.speed = 0;
    this.velocity = { x: 0, y: 0 };

    this.maxSpeed = 6;
    this.acceleration = 0.15;
    this.turnSpeed = 0.045;
    this.friction = 0.97;
    this.driftFactor = 0.85;
  }

  update(input) {
    if (input.keys["ArrowUp"]) this.speed += this.acceleration;
    if (input.keys["ArrowDown"]) this.speed -= this.acceleration * 0.7;

    this.speed = Math.max(
      Math.min(this.speed, this.maxSpeed),
      -this.maxSpeed / 2
    );

    const turnInfluence = Math.min(Math.abs(this.speed) / this.maxSpeed, 1);
    if (input.keys["ArrowLeft"]) this.angle -= this.turnSpeed * turnInfluence;
    if (input.keys["ArrowRight"]) this.angle += this.turnSpeed * turnInfluence;

    const forwardX = Math.cos(this.angle);
    const forwardY = Math.sin(this.angle);

    this.velocity.x += forwardX * this.speed;
    this.velocity.y += forwardY * this.speed;

    this.velocity.x *= this.driftFactor;
    this.velocity.y *= this.driftFactor;

    this.x += this.velocity.x;
    this.y += this.velocity.y;

    this.speed *= this.friction;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = "#e63946";
    ctx.fillRect(-10, -6, 20, 12);
    ctx.restore();
  }
}

class Track {
  constructor(data) {
    this.path = data.path;
    this.startLine = data.startLine;
    this.laps = data.laps;
  }

  draw(ctx) {
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 40;
    ctx.lineJoin = "round";
    ctx.beginPath();
    this.path.forEach((p, i) =>
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
    );
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(this.startLine.a.x, this.startLine.a.y);
    ctx.lineTo(this.startLine.b.x, this.startLine.b.y);
    ctx.stroke();
  }
}

class LapManager {
  constructor(track) {
    this.track = track;
    this.currentLap = 0;
    this.lastCross = false;
  }

  update(car) {
    const a = this.track.startLine.a;
    const b = this.track.startLine.b;

    const cross =
      (car.x - a.x) * (b.y - a.y) -
      (car.y - a.y) * (b.x - a.x) > 0;

    if (cross && !this.lastCross && car.speed > 1) {
      this.currentLap++;
    }
    this.lastCross = cross;
  }
}

class Minimap {
  constructor(track) {
    this.track = track;
    this.scale = 0.12;
  }

  draw(ctx, car) {
    ctx.save();
    ctx.translate(20, 20);
    ctx.scale(this.scale, this.scale);

    ctx.strokeStyle = "#888";
    ctx.lineWidth = 20;
    ctx.beginPath();
    this.track.path.forEach((p, i) =>
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
    );
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = "#f1faee";
    ctx.beginPath();
    ctx.arc(car.x, car.y, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    this.resize();

    window.addEventListener("resize", () => this.resize());

    this.input = new Input();
    this.camera = new Camera();

    this.track = new Track({
      laps: 3,
      startLine: {
        a: { x: 0, y: -200 },
        b: { x: 0, y: -120 }
      },
      path: [
        { x: 0, y: -300 },
        { x: 400, y: -200 },
        { x: 400, y: 200 },
        { x: 0, y: 300 },
        { x: -400, y: 200 },
        { x: -400, y: -200 }
      ]
    });

    this.car = new Car(0, -250);
    this.laps = new LapManager(this.track);
    this.minimap = new Minimap(this.track);

    requestAnimationFrame(() => this.loop());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  update() {
    this.car.update(this.input);
    this.camera.follow(this.car);
    this.laps.update(this.car);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(
      this.canvas.width / 2 - this.camera.x,
      this.canvas.height / 2 - this.camera.y
    );

    this.track.draw(ctx);
    this.car.draw(ctx);
    ctx.restore();

    this.minimap.draw(ctx, this.car);

    ctx.fillStyle = "#fff";
    ctx.font = "18px monospace";
    ctx.fillText(
      `Lap ${this.laps.currentLap}/${this.track.laps}`,
      20,
      this.canvas.height - 20
    );
  }
}

new Game();
