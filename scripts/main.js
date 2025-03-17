const ctx = document.getElementById('canvas').getContext('2d');
let canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight; 
let scaleFactor = 1;

let centreX = 0;
let centreY = 0;

const charges = [
    {
        position: [0.5, 0],
        velocity: [0, 0.5],
        q: 1
    },

    {
        position: [-0.5, 0],
        velocity: [0, -0.5],
        q: -1    
    },

    {
        position: [0, 0],
        velocity: [0, 0],
        q: 0.04
    },

]

function drawGridLines(ctx, canvasWidth, canvasHeight, centreX, centreY, scaleFactor) {
    ctx.save();

    const aspectRatio = canvasWidth / canvasHeight;
    // Transform the context to match the current view
    ctx.translate(canvasWidth / 2 + centreX, canvasHeight / 2 + centreY);
    ctx.scale(canvasWidth / 2 * scaleFactor, -canvasHeight / 2 * scaleFactor * aspectRatio );

    // Calculate grid line spacing in world units
    const gridSize = 0.1;

    // Calculate the visible range of the grid in world units
    const visibleWidth = 2 / scaleFactor;
    const visibleHeight = 2 / scaleFactor / aspectRatio;

    // Calculate screen center in world coordinates
    const worldCenterX = -centreX / (canvasWidth / 2) / scaleFactor;
    const worldCenterY = centreY / (canvasHeight / 2) / scaleFactor / aspectRatio;

    
    // Draw the grid lines
    ctx.beginPath();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.0002;

    // Draw vertical lines
    for (let x = Math.floor(worldCenterX - visibleWidth / 2); x < worldCenterX + visibleWidth / 2; x += gridSize) {
        ctx.moveTo(x, worldCenterY - visibleHeight / 2);
        ctx.lineTo(x, worldCenterY + visibleHeight / 2);
    }

    // Draw horizontal lines
    for (let y = Math.floor(worldCenterY - visibleHeight / 2); y < worldCenterY + visibleHeight / 2; y += gridSize) {
        ctx.moveTo(worldCenterX - visibleWidth / 2, y);
        ctx.lineTo(worldCenterX + visibleWidth / 2, y);
    }


    ctx.stroke();

    ctx.restore();
}

function drawCharges() {
    // scale the canvas
    const aspectRatio = canvas.width / canvas.height;
    ctx.save();
    ctx.translate(canvas.width/2 + centreX, canvas.height/2 + centreY);
    ctx.scale(canvas.width/2 * scaleFactor, -canvas.height/2 * aspectRatio * scaleFactor);
    // translate the canvas
    
    charges.forEach(charge => {
        ctx.beginPath();
        const radius = 0.03;
        ctx.arc(charge.position[0], charge.position[1], radius, 0, 2 * Math.PI);
        ctx.fillStyle = charge.q > 0 ? 'red' : '#2aacdf';
        ctx.fill();
    });
    ctx.restore();
}

function normalize({x1, y1}){
    const magnitude = Math.sqrt(x1**2 + y1**2);
    return [ x1/magnitude, y1/magnitude ];
}

function eval_force(charge1, charge2){
    const dst = math.distance(charge1.position, charge2.position);
    const force = charge1.q * charge2.q / dst**2;
    let direction = math.subtract(charge1.position, charge2.position);
    direction = normalize({x1: direction[0], y1: direction[1]});
    return math.multiply(direction, force * 0.5);
}

function tick_simulation(dt) {
    charges.forEach(charge => {
        charge.position = math.add(charge.position, math.multiply(charge.velocity, dt));
    });

    console.log(charges);
    charges.forEach(charge1 => {
        let force = [0, 0];
        charges.forEach(charge2 => {
            if(charge1 !== charge2){
                force = math.add(force, eval_force(charge1, charge2))
            }
        });
        charge1.velocity = math.add(charge1.velocity, math.multiply(force, dt));
    });
                
}

let previousTime = Date.now();
function update() {
    // get elapsed time
    const currentTime = Date.now();
    const dt = (currentTime - previousTime) / 1000;
    previousTime = currentTime;

    tick_simulation(dt);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGridLines(ctx, canvas.width, canvas.height, centreX, centreY, scaleFactor);
    drawCharges();

    window.requestAnimationFrame(update);
}

// zoom mouse wheel
canvas.addEventListener('wheel', (e) => {
// zoom around the mouse coordinates
    e.preventDefault(); 
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const previousScale = scaleFactor; // Store the previous scale
    scaleFactor *= zoomFactor;

    // Calculate mouse position relative to the canvas center
    const mouseX = e.clientX - canvas.width / 2;
    const mouseY = e.clientY - canvas.height / 2;

    // Calculate the new center based on the mouse position and zoom
    centreX = mouseX - (mouseX - centreX) * (scaleFactor / previousScale);
    centreY = mouseY - (mouseY - centreY) * (scaleFactor / previousScale);

    drawCharges();
});

// drag canvas
let isDragging = false;
let lastX = 0;
let lastY = 0;
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});
canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        centreX += dx;
        centreY += dy;
        drawCharges();
    }
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawCharges();
});

window.requestAnimationFrame(update);