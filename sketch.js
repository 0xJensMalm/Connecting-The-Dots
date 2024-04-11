const sketchConfig = {
  canvasSize: { width: 800, height: 800 },
  zoom: { min: 0.5, max: 5, initial: 3.1, sensitivity: 1000 },
  gridColor: [204, 255, 51],
  pointGridSize: 2,
  vertexDistanceThreshold: 6, //less is more
  modelRotation: { x: 90, y: 0, z: 100 }, // Rotation angles in degrees
  autoRotation: 15,
  // face: x: 180 y: 180 z: 0
  // fly: x: 90, y: 0, z: 100
};

const particleConfig = {
  numParticles: 1000,
  size: 2.5,
  lineStrokeSize: 0.2,
  linesEnabled: false,
  lineLifespan: 50,
  pathLength: 30, //distance threshold to next target
  particleSpeed: 1,
  /*colors: [
    [255, 204, 0],
    [0, 255, 255],
    [255, 105, 180],
  ],*/
  colors: [
    [112, 224, 0],
    [220, 47, 2],
    [255, 186, 8],
  ],
};

let myModel;
let particles = [];
let filteredVertices = [];
let zoom = sketchConfig.zoom.initial;
let capturer;

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

  // Apply rotation around X and Y axes
  rotateX(radians(sketchConfig.modelRotation.x));
  rotateY(radians(sketchConfig.modelRotation.y));

  // Apply auto rotation around Z axis
  let zRotation =
    radians(sketchConfig.modelRotation.z) +
    map(sketchConfig.autoRotation, 0, 100, 0, 0.1) * frameCount;
  rotateZ(zRotation);

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
  // Use the RGB values from gridColor for the stroke color
  stroke(...sketchConfig.gridColor); // Spread operator to unpack the array
  strokeWeight(sketchConfig.pointGridSize); // Use pointGridSize for stroke weight, which controls point size

  // Draw each vertex as a point
  beginShape(POINTS);
  filteredVertices.forEach((v) => {
    vertex(v.x, v.y, v.z);
  });
  endShape();
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
      stroke(this.color); // Use the particle's color for the trail
      strokeWeight(particleConfig.lineStrokeSize);
      this.trail.forEach((p) => {
        vertex(p.x, p.y, p.z);
      });
      endShape();
    }

    // Display the particle as a point
    stroke(this.color); // Set the color of the point
    strokeWeight(particleConfig.size); // Set the size of the point
    point(this.pos.x, this.pos.y, this.pos.z); // Draw the point at the particle's position
  }

  isOutOfBound() {
    const center = createVector(0, 0, 0); // Assuming the center of the grid is at (0, 0, 0)
    const maxDistance = 300; // Maximum allowed distance from the center
    return this.pos.dist(center) > maxDistance;
  }
}
function keyPressed() {
  if (key === "s" || key === "S") {
    // This will save a 5-second GIF, starting 1 second after pressing 's'.
    // The GIF will be named 'mySketch.gif'.
    // It will show progress notifications that won't auto-dismiss.
    saveGif("mySketch", 10, {
      delay: 1,
      silent: false,
      notificationDuration: 0,
    });
  }
}
