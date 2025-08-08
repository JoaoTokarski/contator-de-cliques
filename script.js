// Configurações do jogo
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Variáveis do jogo
let score = 0;
let health = 100;
let gameOver = false;

// Player (Spectre)
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 50,
    height: 70,
    speed: 5,
    color: '#00FFFF',
    bullets: [],
    shootCooldown: 0,
    shoot: function() {
        if (this.shootCooldown <= 0) {
            this.bullets.push({
                x: this.x + this.width / 2 - 2.5,
                y: this.y,
                width: 5,
                height: 15,
                speed: 10,
                color: '#FF00FF'
            });
            this.shootCooldown = 10;
            // Som de tiro (simulado)
            const shootSound = new Audio('assets/shoot.wav');
            shootSound.play().catch(e => console.log("Audio error"));
        }
    }
};

// Inimigos
const enemies = [];
function spawnEnemy() {
    enemies.push({
        x: Math.random() * (canvas.width - 50),
        y: -50,
        width: 40,
        height: 60,
        speed: 2 + Math.random() * 2,
        color: '#FF0000'
    });
}

// Controles
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    ' ': false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    if (e.key === ' ') player.shoot();
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// Loop do jogo
function gameLoop() {
    if (gameOver) return;

    // Limpar tela
    ctx.fillStyle = 'rgba(0, 0, 20, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Atualizar player
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
    if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += player.speed;

    if (player.shootCooldown > 0) player.shootCooldown--;

    // Desenhar player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Atualizar e desenhar balas
    player.bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // Remover balas fora da tela
        if (bullet.y < 0) {
            player.bullets.splice(index, 1);
        }
    });

    // Spawn de inimigos
    if (Math.random() < 0.02) spawnEnemy();

    // Atualizar e desenhar inimigos
    enemies.forEach((enemy, enemyIndex) => {
        enemy.y += enemy.speed;
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Colisão com balas
        player.bullets.forEach((bullet, bulletIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                enemies.splice(enemyIndex, 1);
                player.bullets.splice(bulletIndex, 1);
                score += 10;
                document.getElementById('score').textContent = `Score: ${score}`;
            }
        });

        // Colisão com player
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            health -= 10;
            document.getElementById('health').textContent = `Health: ${health}%`;
            enemies.splice(enemyIndex, 1);

            if (health <= 0) {
                gameOver = true;
                alert(`Game Over! Score: ${score}`);
            }
        }
    });

    requestAnimationFrame(gameLoop);
}

// Iniciar jogo
gameLoop();