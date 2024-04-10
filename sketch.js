const sketchConfig = {
  canvasSize: { width: 800, height: 800 },
  zoom: { min: 0.5, max: 5, initial: 2.5, sensitivity: 1000 },
  gridColor: [0, 255, 255],
  pointGridSize: 0.4,
  vertexDistanceThreshold: 10,
  modelRotation: { x: 90, y: 0, z: 100 }, // Rotation angles in degrees
  // x180 y180 z0
};

const particleConfig = {
  numParticles: 200,
  size: 0.5,
  lineStrokeSize: 0.2,
  linesEnabled: false,
  lineLifespan: 200,
  pathLength: 30, //distance threshold to next target
  particleSpeed: 1,
  colors: [
    [255, 204, 0],
    [0, 255, 255],
    [255, 105, 180],
  ],
};

let myModel;
let particles = [];
let filteredVertices = [];
let zoom = sketchConfig.zoom.initial;

function preload() {
  myModel = loadModel("fly.obj", true);
}

function setup() {
  createCanvas(
    sketchConfig.canvasSize.width,
    sketchConfig.canvasSize.height,
    WEBGL
  );
  colorMode(RGB);
  filterVertices(myModel.vertices);
  initializeParticles();
}

function draw() {
  background(0);
  orbitControl();
  scale(zoom);

  // Apply rotation around X, Y, and Z axes
  rotateX(radians(sketchConfig.modelRotation.x));
  rotateY(radians(sketchConfig.modelRotation.y));
  rotateZ(radians(sketchConfig.modelRotation.z));

  displayVertices();
  updateAndDisplayParticles();
}

function filterVertices(vertices) {
  vertices.forEach((v) => {
    const tooClose = filteredVertices.some(
      (other) =>
        dist(v.x, v.y, v.z, other.x, other.y, other.z) <
        sketchConfig.vertexDistanceThreshold
    );
    if (!tooClose) {
      filteredVertices.push(v);
    }
  });
}

function initializeParticles() {
  for (let i = 0; i < particleConfig.numParticles; i++) {
    particles.push(
      new Particle(random(filteredVertices), random(particleConfig.colors))
    );
  }
}

function displayVertices() {
  noStroke();
  fill(sketchConfig.gridColor);
  filteredVertices.forEach((v) => {
    push();
    translate(v.x, v.y, v.z);
    sphere(sketchConfig.pointGridSize); // Use pointGridSize for sphere size
    pop();
  });
}

function updateAndDisplayParticles() {
  particles.forEach((particle) => {
    particle.update();
    particle.display();
  });
}

function mouseWheel(event) {
  zoom -= event.delta / sketchConfig.zoom.sensitivity;
  zoom = constrain(zoom, sketchConfig.zoom.min, sketchConfig.zoom.max);
}

class Particle {
  constructor(initialPos, color) {
    this.pos = createVector(initialPos.x, initialPos.y, initialPos.z);
    this.color = color;
    this.trail = [];
    this.setRandomTarget();
  }

  setRandomTarget() {
    const possibleTargets = filteredVertices.filter(
      (v) =>
        this.pos.dist(createVector(v.x, v.y, v.z)) <= particleConfig.pathLength
    );
    this.target =
      possibleTargets.length > 0 ? random(possibleTargets) : this.pos.copy();
    this.velocity = p5.Vector.sub(this.target, this.pos).setMag(
      particleConfig.particleSpeed
    );
  }

  update() {
    // Check if the particle has reached its target or is out of bounds
    if (this.pos.dist(this.target) < 1 || this.isOutOfBound()) {
      this.setRandomTarget();
    }
    this.pos.add(this.velocity);

    // Add the current position to the trail and remove the oldest if necessary
    this.trail.push(this.pos.copy());
    if (this.trail.length > particleConfig.lineLifespan) {
      this.trail.shift();
    }
  }

  display() {
    // Display the trail if enabled
    if (particleConfig.linesEnabled && this.trail.length > 1) {
      beginShape();
      noFill();
      stroke(this.color);
      strokeWeight(particleConfig.lineStrokeSize);
      this.trail.forEach((p) => vertex(p.x, p.y, p.z));
      endShape();
    }

    // Display the particle as a sphere
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    fill(this.color);
    sphere(particleConfig.size);
    pop();
  }

  isOutOfBound() {
    const center = createVector(0, 0, 0); // Assuming the center of the grid is at (0, 0, 0)
    const maxDistance = 300; // Maximum allowed distance from the center
    return this.pos.dist(center) > maxDistance;
  }
}
