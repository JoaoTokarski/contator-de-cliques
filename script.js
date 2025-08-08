// Configurações do jogo
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Elementos da interface
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const levelDisplay = document.getElementById('level');
const enemiesRemainingDisplay = document.getElementById('enemies-remaining');
const gameOverScreen = document.getElementById('game-over');
const levelCompleteScreen = document.getElementById('level-complete');
const finalScoreDisplay = document.getElementById('final-score');

// Variáveis do jogo
let gameRunning = false;
let score = 0;
let lives = 3;
let level = 1;
let enemies = [];
let bullets = [];
let enemyBullets = [];
let explosions = [];
let powerUps = [];
let boss = null;
let enemiesInWave = 0;
let enemiesKilledInWave = 0;
let lastEnemySpawn = 0;
let lastBossSpawn = 0;
let gameTime = 0;
let keys = {};
let backgroundOffset = 0;

// Imagens (seriam carregadas de arquivos reais em um jogo completo)
const images = {
    player: createPlayerImage(),
    enemy: createEnemyImage(),
    boss: createBossImage(),
    bullet: createBulletImage(),
    enemyBullet: createEnemyBulletImage(),
    background: createBackgroundImage()
};

// Sons (seriam carregados de arquivos reais em um jogo completo)
const sounds = {
    shoot: { play: () => {} },
    explosion: { play: () => {} },
    bossSpawn: { play: () => {} },
    bossHit: { play: () => {} }
};

// Objeto do jogador
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 80,
    width: 50,
    height: 50,
    speed: 5,
    color: '#4af',
    cooldown: 0,
    canShoot: true,
    invincible: false,
    invincibleTimer: 0
};

// Configuração de controles
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Botões do menu
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Função para iniciar o jogo
function startGame() {
    // Resetar variáveis do jogo
    gameRunning = true;
    score = 0;
    lives = 3;
    level = 1;
    enemies = [];
    bullets = [];
    enemyBullets = [];
    explosions = [];
    powerUps = [];
    boss = null;
    enemiesInWave = 0;
    enemiesKilledInWave = 0;
    
    // Resetar posição do jogador
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 80;
    player.invincible = true;
    player.invincibleTimer = 120; // 2 segundos de invencibilidade
    
    // Atualizar interface
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    levelDisplay.textContent = level;
    enemiesRemainingDisplay.textContent = enemiesInWave - enemiesKilledInWave;
    
    // Esconder telas de game over e level complete
    gameOverScreen.classList.add('hidden');
    levelCompleteScreen.classList.add('hidden');
    
    // Mostrar/ocultar botões apropriados
    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
    
    // Iniciar loop do jogo
    gameLoop();
}

// Função principal do jogo
function gameLoop() {
    if (!gameRunning) return;
    
    update();
    render();
    
    requestAnimationFrame(gameLoop);
}

// Atualizar estado do jogo
function update() {
    gameTime++;
    
    // Movimentação do jogador
    if (keys['ArrowLeft'] || keys['a']) player.x = Math.max(0, player.x - player.speed);
    if (keys['ArrowRight'] || keys['d']) player.x = Math.min(canvas.width - player.width, player.x + player.speed);
    if (keys['ArrowUp'] || keys['w']) player.y = Math.max(0, player.y - player.speed);
    if (keys['ArrowDown'] || keys['s']) player.y = Math.min(canvas.height - player.height, player.y + player.speed);
    
    // Disparo do jogador
    if ((keys[' '] || keys['x']) && player.canShoot) {
        shoot();
        player.canShoot = false;
        player.cooldown = 15; // Cooldown de 15 frames
    }
    
    // Atualizar cooldown do tiro
    if (player.cooldown > 0) {
        player.cooldown--;
        if (player.cooldown === 0) {
            player.canShoot = true;
        }
    }
    
    // Atualizar invencibilidade
    if (player.invincible) {
        player.invincibleTimer--;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }
    
    // Gerar inimigos
    spawnEnemies();
    
    // Atualizar inimigos
    updateEnemies();
    
    // Atualizar balas
    updateBullets();
    
    // Atualizar balas inimigas
    updateEnemyBullets();
    
    // Atualizar explosões
    updateExplosions();
    
    // Atualizar chefão
    updateBoss();
    
    // Atualizar power-ups
    updatePowerUps();
    
    // Verificar colisões
    checkCollisions();
    
    // Verificar fim de fase
    checkLevelComplete();
    
    // Atualizar fundo
    backgroundOffset = (backgroundOffset + 0.5) % canvas.height;
}

// Renderizar o jogo
function render() {
    // Fundo
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar estrelas (fundo animado)
    drawBackground();
    
    // Desenhar jogador
    if (!player.invincible || Math.floor(gameTime / 10) % 2 === 0) {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Desenhar inimigos
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
    
    // Desenhar balas
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // Desenhar balas inimigas
    enemyBullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // Desenhar explosões
    explosions.forEach(explosion => {
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, ${100 + explosion.life * 5}, 0, ${explosion.life / 20})`;
        ctx.fill();
    });
    
    // Desenhar chefão
    if (boss) {
        ctx.fillStyle = boss.color;
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
    }
    
    // Desenhar power-ups
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.color;
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Função para disparar
function shoot() {
    bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 15,
        speed: 10,
        color: '#ff0'
    });
    sounds.shoot.play();
}

// Função para gerar inimigos
function spawnEnemies() {
    // Se já tem um chefão, não spawna inimigos normais
    if (boss) return;
    
    // Se já matou todos os inimigos da fase, não spawna mais
    if (enemiesKilledInWave >= enemiesInWave) return;
    
    // Spawn de inimigos baseado no tempo e fase
    if (gameTime - lastEnemySpawn > 60 - level * 5 && enemies.length < 5 + level) {
        const enemyType = Math.random() < 0.1 ? 'elite' : 'normal';
        
        enemies.push({
            x: Math.random() * (canvas.width - 40),
            y: -40,
            width: 40,
            height: 40,
            speed: 1 + Math.random() * level * 0.3,
            health: enemyType === 'elite' ? 3 : 1,
            maxHealth: enemyType === 'elite' ? 3 : 1,
            color: enemyType === 'elite' ? '#f80' : '#f44',
            type: enemyType,
            shootCooldown: Math.floor(Math.random() * 100),
            shootInterval: enemyType === 'elite' ? 60 : 120
        });
        
        lastEnemySpawn = gameTime;
    }
}

// Função para atualizar inimigos
function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Movimento
        enemy.y += enemy.speed;
        
        // Disparo
        if (enemy.shootCooldown <= 0 && Math.random() < 0.02 && enemy.y > 0) {
            enemyBullets.push({
                x: enemy.x + enemy.width / 2 - 3,
                y: enemy.y + enemy.height,
                width: 6,
                height: 15,
                speed: 5,
                color: '#f00'
            });
            enemy.shootCooldown = enemy.shootInterval;
        } else {
            enemy.shootCooldown--;
        }
        
        // Remover inimigos que saíram da tela
        if (enemy.y > canvas.height) {
            enemies.splice(i, 1);
        }
    }
}

// Função para atualizar balas
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= bullet.speed;
        
        // Remover balas que saíram da tela
        if (bullet.y < 0) {
            bullets.splice(i, 1);
        }
    }
}

// Função para atualizar balas inimigas
function updateEnemyBullets() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.y += bullet.speed;
        
        // Remover balas que saíram da tela
        if (bullet.y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }
}

// Função para atualizar explosões
function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].life--;
        explosions[i].radius += 0.5;
        
        if (explosions[i].life <= 0) {
            explosions.splice(i, 1);
        }
    }
}

// Função para spawnar chefão
function spawnBoss() {
    sounds.bossSpawn.play();
    
    boss = {
        x: canvas.width / 2 - 60,
        y: -120,
        width: 120,
        height: 120,
        speed: 1,
        health: 10 + level * 5,
        maxHealth: 10 + level * 5,
        color: '#8f0',
        pattern: 0,
        patternTimer: 0,
        shootCooldown: 0,
        invincible: false,
        invincibleTimer: 0
    };
}

// Função para atualizar chefão
function updateBoss() {
    if (!boss) return;
    
    // Movimento
    if (boss.pattern === 0) {
        // Entrando na tela
        boss.y += boss.speed;
        if (boss.y >= 50) {
            boss.pattern = 1;
            boss.patternTimer = 180; // 3 segundos no padrão 1
        }
    } else if (boss.pattern === 1) {
        // Movimento lateral
        boss.x += boss.speed;
        if (boss.x <= 0 || boss.x >= canvas.width - boss.width) {
            boss.speed = -boss.speed;
        }
        
        // Disparo
        if (boss.shootCooldown <= 0) {
            // Disparo circular
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                enemyBullets.push({
                    x: boss.x + boss.width / 2 - 3 + Math.cos(angle) * 20,
                    y: boss.y + boss.height / 2 + Math.sin(angle) * 20,
                    width: 8,
                    height: 8,
                    speed: 3,
                    color: '#0f0',
                    dx: Math.cos(angle) * 3,
                    dy: Math.sin(angle) * 3
                });
            }
            boss.shootCooldown = 60;
        } else {
            boss.shootCooldown--;
        }
        
        // Mudar padrão após um tempo
        boss.patternTimer--;
        if (boss.patternTimer <= 0) {
            boss.pattern = 2;
            boss.patternTimer = 120; // 2 segundos no padrão 2
        }
    } else if (boss.pattern === 2) {
        // Movimento em zigue-zague
        boss.x += boss.speed * 2;
        boss.y += Math.sin(gameTime / 20) * 2;
        
        if (boss.x <= 0 || boss.x >= canvas.width - boss.width) {
            boss.speed = -boss.speed;
        }
        
        // Disparo direcionado ao jogador
        if (boss.shootCooldown <= 0) {
            const angle = Math.atan2(
                player.y + player.height / 2 - (boss.y + boss.height / 2),
                player.x + player.width / 2 - (boss.x + boss.width / 2)
            );
            
            enemyBullets.push({
                x: boss.x + boss.width / 2 - 5,
                y: boss.y + boss.height / 2 - 5,
                width: 10,
                height: 10,
                speed: 4,
                color: '#0f0',
                dx: Math.cos(angle) * 4,
                dy: Math.sin(angle) * 4
            });
            
            boss.shootCooldown = 30;
        } else {
            boss.shootCooldown--;
        }
        
        // Voltar ao padrão 1
        boss.patternTimer--;
        if (boss.patternTimer <= 0) {
            boss.pattern = 1;
            boss.patternTimer = 180;
        }
    }
    
    // Invencibilidade ao ser atingido
    if (boss.invincible) {
        boss.invincibleTimer--;
        if (boss.invincibleTimer <= 0) {
            boss.invincible = false;
        }
    }
}

// Função para atualizar power-ups
function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.y += 2;
        
        // Remover power-ups que saíram da tela
        if (powerUp.y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }
}

// Função para verificar colisões
function checkCollisions() {
    // Colisão entre balas do jogador e inimigos
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Com inimigos normais
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            if (checkCollision(bullet, enemy)) {
                // Criar explosão
                explosions.push({
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y + enemy.height / 2,
                    radius: 10,
                    life: 20
                });
                
                sounds.explosion.play();
                
                // Reduzir vida do inimigo
                enemy.health--;
                
                // Remover bala
                bullets.splice(i, 1);
                
                // Se inimigo morreu
                if (enemy.health <= 0) {
                    enemies.splice(j, 1);
                    enemiesKilledInWave++;
                    score += enemy.type === 'elite' ? 50 : 20;
                    scoreDisplay.textContent = score;
                    
                    // Chance de dropar power-up
                    if (Math.random() < 0.1) {
                        powerUps.push({
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y + enemy.height / 2,
                            radius: 10,
                            color: '#0ff',
                            type: Math.random() < 0.5 ? 'life' : 'power'
                        });
                    }
                }
                
                break;
            }
        }
        
        // Com chefão
        if (boss && !boss.invincible && checkCollision(bullet, boss)) {
            // Criar explosão pequena
            explosions.push({
                x: bullet.x + bullet.width / 2,
                y: bullet.y + bullet.height / 2,
                radius: 5,
                life: 10
            });
            
            sounds.bossHit.play();
            
            // Reduzir vida do chefão
            boss.health--;
            boss.invincible = true;
            boss.invincibleTimer = 10;
            
            // Remover bala
            bullets.splice(i, 1);
            
            // Checar se chefão morreu
            if (boss.health <= 0) {
                // Grande explosão
                for (let k = 0; k < 10; k++) {
                    explosions.push({
                        x: boss.x + boss.width / 2 + Math.random() * 40 - 20,
                        y: boss.y + boss.height / 2 + Math.random() * 40 - 20,
                        radius: 15 + Math.random() * 10,
                        life: 30
                    });
                }
                
                sounds.explosion.play();
                
                // Pontuação
                score += 500 * level;
                scoreDisplay.textContent = score;
                
                // Remover chefão
                boss = null;
                
                // Preparar próxima fase
                setTimeout(() => {
                    levelCompleteScreen.classList.remove('hidden');
                    setTimeout(() => {
                        levelCompleteScreen.classList.add('hidden');
                        nextLevel();
                    }, 2000);
                }, 1000);
            }
        }
    }
    
    // Colisão entre balas inimigas e jogador
    if (!player.invincible) {
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const bullet = enemyBullets[i];
            
            if (checkCollision(bullet, player)) {
                // Criar explosão
                explosions.push({
                    x: player.x + player.width / 2,
                    y: player.y + player.height / 2,
                    radius: 15,
                    life: 30
                });
                
                sounds.explosion.play();
                
                // Remover bala
                enemyBullets.splice(i, 1);
                
                // Reduzir vida do jogador
                lives--;
                livesDisplay.textContent = lives;
                
                // Ativar invencibilidade
                player.invincible = true;
                player.invincibleTimer = 120; // 2 segundos
                
                // Verificar game over
                if (lives <= 0) {
                    gameOver();
                }
                
                break;
            }
        }
    }
    
    // Colisão entre jogador e inimigos
    if (!player.invincible) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            
            if (checkCollision(player, enemy)) {
                // Criar explosão
                explosions.push({
                    x: player.x + player.width / 2,
                    y: player.y + player.height / 2,
                    radius: 15,
                    life: 30
                });
                
                sounds.explosion.play();
                
                // Remover inimigo
                enemies.splice(i, 1);
                enemiesKilledInWave++;
                
                // Reduzir vida do jogador
                lives--;
                livesDisplay.textContent = lives;
                
                // Ativar invencibilidade
                player.invincible = true;
                player.invincibleTimer = 120; // 2 segundos
                
                // Verificar game over
                if (lives <= 0) {
                    gameOver();
                }
                
                break;
            }
        }
    }
    
    // Colisão entre jogador e chefão
    if (boss && !player.invincible && checkCollision(player, boss)) {
        // Criar explosão
        explosions.push({
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            radius: 15,
            life: 30
        });
        
        sounds.explosion.play();
        
        // Reduzir vida do jogador
        lives--;
        livesDisplay.textContent = lives;
        
        // Ativar invencibilidade
        player.invincible = true;
        player.invincibleTimer = 120; // 2 segundos
        
        // Verificar game over
        if (lives <= 0) {
            gameOver();
        }
    }
    
    // Colisão entre jogador e power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        
        if (checkCollisionCircleRect(powerUp, player)) {
            if (powerUp.type === 'life') {
                // Ganhar vida extra
                lives = Math.min(lives + 1, 5);
                livesDisplay.textContent = lives;
            } else {
                // Power-up de tiro (aumenta taxa de disparo temporariamente)
                player.cooldown = Math.max(5, player.cooldown - 5);
            }
            
            // Remover power-up
            powerUps.splice(i, 1);
            
            // Efeito visual
            for (let j = 0; j < 10; j++) {
                explosions.push({
                    x: powerUp.x + Math.random() * 10 - 5,
                    y: powerUp.y + Math.random() * 10 - 5,
                    radius: 5 + Math.random() * 5,
                    life: 15,
                    color: '#0ff'
                });
            }
        }
    }
}

// Função para verificar fim de fase
function checkLevelComplete() {
    if (boss) return; // Se tem chefão, fase não acabou
    
    // Se matou todos os inimigos da fase e não tem mais inimigos na tela
    if (enemiesKilledInWave >= enemiesInWave && enemies.length === 0) {
        spawnBoss();
    }
}

// Função para avançar para próxima fase
function nextLevel() {
    level++;
    levelDisplay.textContent = level;
    
    // Definir número de inimigos para próxima fase
    enemiesInWave = 10 + level * 5;
    enemiesKilledInWave = 0;
    enemiesRemainingDisplay.textContent = enemiesInWave - enemiesKilledInWave;
    
    // Resetar posição do jogador
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 80;
    player.invincible = true;
    player.invincibleTimer = 120;
}

// Função de game over
function gameOver() {
    gameRunning = false;
    finalScoreDisplay.textContent = score;
    gameOverScreen.classList.remove('hidden');
    restartBtn.style.display = 'inline-block';
}

// Função auxiliar para verificar colisão entre retângulos
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Função auxiliar para verificar colisão entre círculo e retângulo
function checkCollisionCircleRect(circle, rect) {
    const distX = Math.abs(circle.x - (rect.x + rect.width / 2));
    const distY = Math.abs(circle.y - (rect.y + rect.height / 2));
    
    if (distX > (rect.width / 2 + circle.radius)) return false;
    if (distY > (rect.height / 2 + circle.radius)) return false;
    
    if (distX <= (rect.width / 2)) return true;
    if (distY <= (rect.height / 2)) return true;
    
    const dx = distX - rect.width / 2;
    const dy = distY - rect.height / 2;
    return (dx * dx + dy * dy <= (circle.radius * circle.radius));
}

// Função para desenhar fundo estrelado
function drawBackground() {
    // Gradiente para efeito de espaço
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000033');
    gradient.addColorStop(1, '#000011');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrelas
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 200; i++) {
        const star = {
            x: Math.random() * canvas.width,
            y: (Math.random() * canvas.height + backgroundOffset) % canvas.height,
            size: Math.random() * 1.5
        };
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
}

// Funções para criar imagens (seriam substituídas por carregamento de arquivos reais)
function createPlayerImage() {
    return { width: 50, height: 50 };
}

function createEnemyImage() {
    return { width: 40, height: 40 };
}

function createBossImage() {
    return { width: 120, height: 120 };
}

function createBulletImage() {
    return { width: 4, height: 15 };
}

function createEnemyBulletImage() {
    return { width: 6, height: 15 };
}

function createBackgroundImage() {
    return { width: 800, height: 600 };
}