// Configurações do Canvas
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Variáveis do Jogo
let score = 0;
let health = 100;
let level = 1;
let gameOver = false;
let enemies = [];
let explosions = [];

// Nave do Jogador
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 80,
    width: 50,
    height: 50,
    speed: 6,
    color: '#4af',
    bullets: [],
    shootCooldown: 0,
    shoot: function() {
        if (this.shootCooldown <= 0) {
            this.bullets.push({
                x: this.x + this.width / 2 - 3,
                y: this.y,
                width: 6,
                height: 15,
                speed: 8,
                color: '#ff0'
            });
            this.shootCooldown = 15;
            // Som de tiro (simulado)
            const shootSound = new Audio('assets/shoot.wav');
            shootSound.play().catch(e => console.log("Audio error"));
        }
    }
};

// Controles
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ' ': false
};

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.ArrowLeft = true;
    if (e.key === 'ArrowRight') keys.ArrowRight = true;
    if (e.key === ' ') keys[' '] = true;
    if (e.key === 'r' && gameOver) resetGame();
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.ArrowLeft = false;
    if (e.key === 'ArrowRight') keys.ArrowRight = false;
    if (e.key === ' ') keys[' '] = false;
});

// Gerar Inimigos
function spawnEnemy() {
    enemies.push({
        x: Math.random() * (canvas.width - 40),
        y: -40,
        width: 40,
        height: 40,
        speed: 1 + Math.random() * level * 0.5,
        color: '#f44'
    });
}

// Explosões
function createExplosion(x, y) {
    explosions.push({
        x,
        y,
        radius: 20,
        alpha: 1,
        color: '#f80'
    });
}

// Reiniciar o Jogo
function resetGame() {
    score = 0;
    health = 100;
    level = 1;
    gameOver = false;
    enemies = [];
    player.bullets = [];
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 80;
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('health').textContent = `Health: ${health}%`;
    document.getElementById('level').textContent = `Level: ${level}`;
    gameLoop();
}

// Loop Principal do Jogo
function gameLoop() {
    if (gameOver) return;

    // Limpar Tela
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Movimento do Jogador
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys[' ']) player.shoot();

    if (player.shootCooldown > 0) player.shootCooldown--;

    // Desenhar Nave
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Atualizar e Desenhar Balas
    player.bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // Remover balas fora da tela
        if (bullet.y < 0) {
            player.bullets.splice(index, 1);
        }
    });

    // Gerar Inimigos
    if (Math.random() < 0.02 * level) spawnEnemy();

    // Atualizar e Desenhar Inimigos
    enemies.forEach((enemy, enemyIndex) => {
        enemy.y += enemy.speed;
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Colisão: Bala x Inimigo
        player.bullets.forEach((bullet, bulletIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                createExplosion(enemy.x, enemy.y);
                enemies.splice(enemyIndex, 1);
                player.bullets.splice(bulletIndex, 1);
                score += 10;
                document.getElementById('score').textContent = `Score: ${score}`;
                if (score % 100 === 0) {
                    level++;
                    document.getElementById('level').textContent = `Level: ${level}`;
                }
            }
        });

        // Colisão: Inimigo x Jogador
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            createExplosion(enemy.x, enemy.y);
            enemies.splice(enemyIndex, 1);
            health -= 10;
            document.getElementById('health').textContent = `Health: ${health}%`;
            if (health <= 0) {
                gameOver = true;
                document.getElementById('game-over').style.display = 'block';
            }
        }

        // Inimigos passam da tela
        if (enemy.y > canvas.height) {
            enemies.splice(enemyIndex, 1);
        }
    });

    // Desenhar Explosões
    explosions.forEach((explosion, index) => {
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 0, ${explosion.alpha})`;
        ctx.fill();
        explosion.alpha -= 0.05;
        explosion.radius += 1;
        if (explosion.alpha <= 0) {
            explosions.splice(index, 1);
        }
    });

    requestAnimationFrame(gameLoop);
}

// Iniciar Jogo
gameLoop();