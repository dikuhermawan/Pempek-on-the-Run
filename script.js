// Pilihan tema warna bergenre Palembang
const AMPERA_RED = "#ad0000";
const PALEMBANG_YELLOW = "#ffe066";

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Karakter utama
const player = {
    x: 50,
    y: 220,          // Ground level start
    width: 40,
    height: 40,
    color: AMPERA_RED,
    vy: 0,           // vertical velocity
    jumpForce: 13,
    gravity: 0.7,
    onGround: true
};

// Lintasan/platform
const ground = {
    y: 260,
    height: 40,
    color: "#567d46"
};

let obstacles = [];
let items = []; // Untuk pempek
let score = 0;
let gameOver = false;
let obstacleTimer = 0;
let itemTimer = 0;

// Gambar latar sederhana: Jembatan Ampera (hanya bentuk)
function drawAmpera() {
    // Pilar kiri
    ctx.fillStyle = AMPERA_RED;
    ctx.fillRect(110, ground.y - 78, 30, 78);
    // Pilar kanan
    ctx.fillRect(460, ground.y - 78, 30, 78);
    // Atas Jembatan
    ctx.fillRect(110, ground.y - 80, 380, 12);
    // Gelagar bawah
    ctx.fillRect(110, ground.y - 40, 380, 8);
}

function drawPlayer() {
    // Karakter berupa lingkaran (wajah dengan peci motif Palembang)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(player.x+player.width/2, player.y+player.height/2, 20, 20, 0, 0, 2 * Math.PI);
    ctx.fillStyle = PALEMBANG_YELLOW;
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.stroke();
    // Peci
    ctx.fillStyle = AMPERA_RED;
    ctx.fillRect(player.x+7, player.y, 26, 12);
    // Mata
    ctx.beginPath();
    ctx.arc(player.x+17, player.y+25, 2, 0, Math.PI*2);
    ctx.arc(player.x+28, player.y+25, 2, 0, Math.PI*2);
    ctx.fillStyle = "#644639";
    ctx.fill();
    ctx.restore();
}

// Rintangan: Bisa kayak box/perahu dengan warna merah/cokelat
function spawnObstacle() {
    const obsType = Math.random() < 0.5 ? 'box' : 'perahu';
    if(obsType === 'box') {
        obstacles.push({
            x: 600,
            y: ground.y - 30,
            width: 30,
            height: 30,
            color: "#a34627",
            type: "box"
        });
    } else { // perahu, bentuk segitiga-perahu
        obstacles.push({
            x: 600,
            y: ground.y - 15,
            width: 38,
            height: 18,
            color: "#836953",
            type: "perahu"
        });
    }
}

// Item pempek berbentuk bulat
function spawnPempek() {
    const h = 24;
    items.push({
        x: 600,
        y: ground.y - 40 - Math.random()*60, // random ketinggian
        radius: h/2, // unik nomor berbeda tiap dimuat
        color: "#f6deaf",
        taken: false
    });
}

// Draw obstacles 
function drawObstacles() {
    obstacles.forEach((obs) => {
        if(obs.type === "box") {
            ctx.fillStyle = obs.color;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            // detail garis-tiap box
            ctx.strokeStyle = "#63412e";
            ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        } else if(obs.type === "perahu") {
            // segitiga perahu kecil
            ctx.fillStyle = obs.color;
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y + obs.height);
            ctx.lineTo(obs.x + obs.width/2, obs.y);
            ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
            ctx.closePath();
            ctx.fill();
        }
    });
}

// Draw pempek
function drawItems() {
    items.forEach((itm) => {
        // pempek: bulat krim, ada kuah di bawah/lukis garis sodet
        ctx.save();
        ctx.beginPath();
        ctx.arc(itm.x, itm.y, itm.radius, 0, Math.PI*2);
        ctx.fillStyle = itm.color;
        ctx.shadowColor = "#fff7ce";
        ctx.shadowBlur = 7;
        ctx.fill();
        // tambahkan cuko tipis
        ctx.beginPath();
        ctx.arc(itm.x, itm.y+itm.radius/1.2, itm.radius/1.3, 0, Math.PI, true);
        ctx.fillStyle = "#543604";
        ctx.fill();
        ctx.restore();
    });
}

// Handle player movement (gravity & jump)
function updatePlayer() {
    // Gravity
    player.y += player.vy;
    player.vy += player.gravity;

    // Menyentuh tanah
    if(player.y + player.height >= ground.y) {
        player.y = ground.y - player.height;
        player.vy = 0;
        player.onGround = true;
    }
}

function jump() {
    if(player.onGround && !gameOver) {
        player.vy = -player.jumpForce;
        player.onGround = false;
    }
}

// Kontrol: Space untuk jump
document.addEventListener('keydown', function(e){
    if(e.code === 'Space') {
        if (gameOver) restart();
        else jump();
    }
});

// Restart game
function restart() {
    score = 0;
    player.y = 220;
    player.vy = 0;
    player.onGround = true;
    obstacles = [];
    items = [];
    obstacleTimer = 0;
    itemTimer = 0;
    gameOver = false;
    draw();
}

function updateObstacles() {
    // Move obstacles
    for(let i=0; i<obstacles.length; i++) {
        obstacles[i].x -= 4;
        // Collision check
        if(rectCollision(player, obstacles[i])) {
            gameOver = true;
        }
        // Remove if out of screen
        if(obstacles[i].x + obstacles[i].width < 0)
            obstacles.splice(i,1), i--;
    }
}

function updateItems() {
    for(let i=0; i<items.length; i++) {
        items[i].x -= 4;
        // Collision dengan player (jika dapet, score ++)
        const dx = (items[i].x - (player.x+player.width/2));
        const dy = (items[i].y - (player.y+player.height/2));
        const d = Math.sqrt(dx*dx+dy*dy);
        if(d < items[i].radius + player.width/2) {
            if (!items[i].taken) {
                score += 10;
                items[i].taken = true;
            }
        }
        // Remove item setelah diambil/keluar layar
        if(items[i].taken || items[i].x+items[i].radius < 0)
            items.splice(i,1), i--;
    }
}

// Simple box collision
function rectCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// Draw text Game Over
function drawGameOver() {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "#fff";
    ctx.fillRect(70, 70, 460, 140);
    ctx.globalAlpha = 1;
    ctx.fillStyle = AMPERA_RED;
    ctx.font = "38px Arial";
    ctx.fillText("Game Over!", 190, 135);
    ctx.fillStyle = "#66492e";
    ctx.font = "25px Arial";
    ctx.fillText("Skor: "+score, 260, 172);
    ctx.font = '16px monospace';
    ctx.fillText("Tekan SPACE untuk mulai lagi", 188, 205);
    ctx.restore();
}

// Draw the game frame
function draw() {
    ctx.clearRect(0,0,canvas.width, canvas.height);

    // Gambar Ampera background
    drawAmpera();

    // Ground
    ctx.fillStyle = ground.color;
    ctx.fillRect(0, ground.y, canvas.width, ground.height);

    // Karakter Pemain
    drawPlayer();

    // Obstacle & Pempek
    drawItems();
    drawObstacles();

    if (gameOver) drawGameOver();

    // Update skor di DOM
    document.getElementById('scoreText').textContent = "Skor: "+score;
}

// Main game loop
function gameLoop() {
    if(!gameOver){
        // Advance game world
        updatePlayer();

        obstacleTimer++;
        itemTimer++;

        // Spawning obstacle tiap 80-110 frames
        if(obstacleTimer > 80 + Math.random()*30){
            obstacleTimer = 0;
            spawnObstacle();
        }

        // Spawning pempek tiap 55-120 frames
        if(itemTimer > 55 + Math.random()*65){
            itemTimer = 0;
            spawnPempek();
        }

        updateObstacles();
        updateItems();
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// Start!
draw();
gameLoop();
