class Random {
  static int(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  static color() {
    var hue = this.int(0, 360);
    return 'hsla(' + hue + ', 80%, 50%, .8)';
  }
}

class CanvasPlotter {
  constructor(canvasId) {
    this.canvas = document.querySelector(canvasId);
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.context = this.canvas.getContext('2d');
  }

  degToRad(deg) {
    return (deg * Math.PI / 180);
  }

  get height() {
    return this.canvas.height;
  }

  get width() {
    return this.canvas.width;
  }

  plotPoint(x, y) {
    this.context.beginPath();
    this.context.moveTo(x, y);
    this.context.arc(x, y, 1, 0, this.degToRad(360));
    this.context.lineWidth = 5;
    this.context.fillStyle = Random.color();
    this.context.fill();
  }
}

class TriangleFractal {
  constructor(canvasId) {
    this.canvas = new CanvasPlotter(canvasId);
    this.cornerPoints = [{
      x: this.canvas.width / 2,
      y: 5
    }, {
      x: 5,
      y: this.canvas.height - 5
    }, {
      x: this.canvas.width - 5,
      y: this.canvas.height - 5
    }];
    this.previousPoint = this.randomCornerPoint();
    this.limit = 20000;
  }

  randomCornerPoint() {
    return this.cornerPoints[Random.int(0, this.cornerPoints.length - 1)];
  }

  calculateMidpoint() {
    const randomCorner = this.randomCornerPoint();
    const point = {
      x: (this.previousPoint.x + randomCorner.x) / 2,
      y: (this.previousPoint.y + randomCorner.y) / 2
    };
    this.previousPoint = point;
    return point;
  }

  plotTriangle() {
    for (let i = 0; i < this.limit; i++) {
      let point = this.calculateMidpoint();
      this.canvas.plotPoint(point.x, point.y);
    }
  }
}

const canvas = new TriangleFractal('#triangle');

canvas.plotTriangle();
