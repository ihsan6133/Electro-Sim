const ctx = document.getElementById('canvas').getContext('2d');
let canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight; 
let scaleFactor = 1;

let centreX = 0;
let centreY = 0;

const charges = [
    { x: 0, y: 0, q: 1, vx: 0.1, vy: 0 },
    { x: 0, y: -0.5, q: -1, vx: -0.1, vy: 0 },
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
        ctx.arc(charge.x, charge.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = charge.q > 0 ? 'red' : 'blue';
        ctx.fill();
    });
    ctx.restore();
}

function normalize({x1, y1}){
    const magnitude = Math.sqrt(x1**2 + y1**2);
    return {x: x1/magnitude, y: y1/magnitude};
}

function tick_simulation(dt) {
    charges.forEach(charge => {
        charge.x += charge.vx * dt;
        charge.y += charge.vy * dt;
    });


    const dst = Math.sqrt((charges[0].x - charges[1].x)**2 + (charges[0].y - charges[1].y)**2);

    const force = charges[0].q * charges[1].q / dst**2;

    const direction = normalize({x1: charges[1].x - charges[0].x, y1: charges[1].y - charges[0].y});

    charges[0].vx -= (direction.x * force)/100 * dt;
    charges[0].vy -= (direction.y * force)/100 * dt; 

    charges[1].vx += (direction.x * force)/100 * dt;
    charges[1].vy += (direction.y * force)/100 * dt;

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

window.requestAnimationFrame(update);