// Configurações do jogo
const config = {
    playerSpeed: 5,
    jumpForce: 12,
    gravity: 0.5,
    enemySpeed: 2.5,
    weaponFireRate: 200,
    enemySpawnRate: 2000,
    missionKillsRequired: 10
};

// Estado do jogo
const gameState = {
    player: {
        x: 0,
        y: 0,
        width: 40,
        height: 80,
        velocityX: 0,
        velocityY: 0,
        isJumping: false,
        health: 100,
        currentWeapon: 'pistol',
        weapons: {
            pistol: { ammo: Infinity, damage: 10, color: '#FFD700' },
            rifle: { ammo: 30, damage: 20, color: '#00FF00' }
        }
    },
    enemies: [],
    projectiles: [],
    keys: {
        a: false,
        d: false,
        w: false,
        space: false
    },
    lastShot: 0,
    lastEnemySpawn: 0,
    gameRunning: false,
    kills: 0
};

// Elementos DOM
const elements = {
    canvas: document.getElementById('game-canvas'),
    ctx: null,
    healthBar: document.getElementById('health-bar'),
    ammoDisplay: document.getElementById('ammo-display'),
    missionDisplay: document.getElementById('mission-display'),
    mainMenu: document.getElementById('main-menu'),
    gameOverScreen: document.getElementById('game-over'),
    gameOverText: document.getElementById('game-over-text'),
    startBtn: document.getElementById('start-btn'),
    howtoBtn: document.getElementById('howto-btn'),
    restartBtn: document.getElementById('restart-btn')
};

// Inicialização do jogo
function init() {
    elements.ctx = elements.canvas.getContext('2d');
    resizeCanvas();
    
    // Event listeners
    window.addEventListener('resize', resizeCanvas);
    elements.startBtn.addEventListener('click', startGame);
    elements.howtoBtn.addEventListener('click', showHowToPlay);
    elements.restartBtn.addEventListener('click', startGame);
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    elements.canvas.addEventListener('mousedown', handleShoot);
    
    // Mostrar menu principal
    showMainMenu();
}

// Redimensionar canvas
function resizeCanvas() {
    elements.canvas.width = window.innerWidth;
    elements.canvas.height = window.innerHeight;
}

// Mostrar menu principal
function showMainMenu() {
    elements.mainMenu.classList.remove('hidden');
    elements.gameOverScreen.classList.add('hidden');
}

// Iniciar jogo
function startGame() {
    elements.mainMenu.classList.add('hidden');
    elements.gameOverScreen.classList.add('hidden');
    
    // Resetar estado do jogo
    gameState.player = {
        ...gameState.player,
        x: elements.canvas.width / 2 - 20,
        y: elements.canvas.height - 150,
        health: 100,
        currentWeapon: 'pistol'
    };
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.lastEnemySpawn = 0;
    gameState.gameRunning = true;
    gameState.kills = 0;
    
    updateHUD();
    gameLoop();
}

// Loop principal do jogo
function gameLoop() {
    if (!gameState.gameRunning) return;
    
    // Limpar canvas
    elements.ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    
    // Atualizar posições
    updatePlayer();
    updateEnemies();
    updateProjectiles();
    
    // Verificar colisões
    checkCollisions();
    
    // Renderizar
    drawBackground();
    drawPlayer();
    drawEnemies();
    drawProjectiles();
    
    // Spawn de inimigos
    spawnEnemies();
    
    // Verificar missão completa
    if (gameState.kills >= config.missionKillsRequired) {
        missionComplete();
        return;
    }
    
    // Continuar loop
    requestAnimationFrame(gameLoop);
}

// Atualizar jogador
function updatePlayer() {
    // Movimento horizontal
    gameState.player.velocityX = 0;
    if (gameState.keys.a) gameState.player.velocityX = -config.playerSpeed;
    if (gameState.keys.d) gameState.player.velocityX = config.playerSpeed;
    
    // Aplicar gravidade
    gameState.player.velocityY += config.gravity;
    
    // Atualizar posição
    gameState.player.x += gameState.player.velocityX;
    gameState.player.y += gameState.player.velocityY;
    
    // Limites da tela
    if (gameState.player.x < 0) gameState.player.x = 0;
    if (gameState.player.x > elements.canvas.width - gameState.player.width) {
        gameState.player.x = elements.canvas.width - gameState.player.width;
    }
    
    // Colisão com o chão
    const groundLevel = elements.canvas.height - 150;
    if (gameState.player.y > groundLevel) {
        gameState.player.y = groundLevel;
        gameState.player.velocityY = 0;
        gameState.player.isJumping = false;
    }
}

// Atualizar inimigos
function updateEnemies() {
    gameState.enemies.forEach((enemy, index) => {
        // Movimento em direção ao jogador
        const dx = gameState.player.x - enemy.x;
        const dy = gameState.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed * 0.3;
        
        // Remover se sair da tela
        if (enemy.x < -100 || enemy.x > elements.canvas.width + 100) {
            gameState.enemies.splice(index, 1);
        }
    });
}

// Atualizar projéteis
function updateProjectiles() {
    gameState.projectiles.forEach((proj, index) => {
        proj.x += proj.velocityX;
        proj.y += proj.velocityY;
        
        // Remover se sair da tela
        if (proj.x < 0 || proj.x > elements.canvas.width || 
            proj.y < 0 || proj.y > elements.canvas.height) {
            gameState.projectiles.splice(index, 1);
        }
    });
}

// Verificar colisões
function checkCollisions() {
    // Colisão projétil-inimigo
    gameState.projectiles.forEach((proj, projIndex) => {
        gameState.enemies.forEach((enemy, enemyIndex) => {
            if (checkCollision(proj, enemy)) {
                // Dano no inimigo
                enemy.health -= proj.damage;
                
                // Remover projétil
                gameState.projectiles.splice(projIndex, 1);
                
                // Verificar se inimigo morreu
                if (enemy.health <= 0) {
                    gameState.enemies.splice(enemyIndex, 1);
                    gameState.kills++;
                    updateHUD();
                }
            }
        });
    });
    
    // Colisão jogador-inimigo
    gameState.enemies.forEach(enemy => {
        if (checkCollision(gameState.player, enemy)) {
            gameState.player.health -= 0.5;
            updateHUD();
            
            if (gameState.player.health <= 0) {
                gameOver();
            }
        }
    });
}

// Verificar colisão entre dois objetos
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Spawn de inimigos
function spawnEnemies() {
    const now = Date.now();
    if (now - gameState.lastEnemySpawn > config.enemySpawnRate && 
        gameState.enemies.length < 5) {
        const enemy = {
            x: Math.random() > 0.5 ? -60 : elements.canvas.width + 60,
            y: elements.canvas.height - 150,
            width: 50,
            height: 90,
            health: 100,
            speed: config.enemySpeed * (0.8 + Math.random() * 0.4)
        };
        
        gameState.enemies.push(enemy);
        gameState.lastEnemySpawn = now;
    }
}

// Desenhar fundo
function drawBackground() {
    // Espaço estrelado
    elements.ctx.fillStyle = '#000033';
    elements.ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);
    
    // Estrelas
    elements.ctx.fillStyle = 'white';
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * elements.canvas.width;
        const y = Math.random() * elements.canvas.height * 0.8;
        const size = Math.random() * 2;
        elements.ctx.fillRect(x, y, size, size);
    }
    
    // Chão
    elements.ctx.fillStyle = '#2a2a4a';
    elements.ctx.fillRect(0, elements.canvas.height - 100, elements.canvas.width, 100);
}

// Desenhar jogador (humano)
function drawPlayer() {
    const p = gameState.player;
    
    // Pernas
    elements.ctx.fillStyle = '#1E90FF';
    elements.ctx.fillRect(p.x, p.y + 50, 15, 30);
    elements.ctx.fillRect(p.x + 25, p.y + 50, 15, 30);
    
    // Corpo
    elements.ctx.fillStyle = '#4169E1';
    elements.ctx.fillRect(p.x, p.y + 20, p.width, 40);
    
    // Cabeça
    elements.ctx.fillStyle = '#FFD700';
    elements.ctx.beginPath();
    elements.ctx.arc(p.x + p.width/2, p.y, 20, 0, Math.PI * 2);
    elements.ctx.fill();
    
    // Arma
    elements.ctx.fillStyle = '#795548';
    elements.ctx.fillRect(p.x + p.width - 10, p.y + 30, 40, 10);
}

// Desenhar inimigos (alienígenas)
function drawEnemies() {
    gameState.enemies.forEach(enemy => {
        // Pernas
        elements.ctx.fillStyle = '#8B0000';
        elements.ctx.beginPath();
        elements.ctx.moveTo(enemy.x + 10, enemy.y + enemy.height);
        elements.ctx.lineTo(enemy.x + 20, enemy.y + 60);
        elements.ctx.lineTo(enemy.x + 30, enemy.y + enemy.height);
        elements.ctx.fill();
        
        // Corpo
        elements.ctx.fillStyle = '#FF0000';
        elements.ctx.beginPath();
        elements.ctx.moveTo(enemy.x, enemy.y + enemy.height - 30);
        elements.ctx.lineTo(enemy.x + enemy.width/2, enemy.y);
        elements.ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height - 30);
        elements.ctx.closePath();
        elements.ctx.fill();
        
        // Olhos
        elements.ctx.fillStyle = '#00FF00';
        elements.ctx.beginPath();
        elements.ctx.arc(enemy.x + enemy.width/3, enemy.y + 20, 8, 0, Math.PI * 2);
        elements.ctx.arc(enemy.x + enemy.width*2/3, enemy.y + 20, 8, 0, Math.PI * 2);
        elements.ctx.fill();
        
        // Barra de saúde
        elements.ctx.fillStyle = 'red';
        elements.ctx.fillRect(enemy.x, enemy.y - 15, enemy.width, 5);
        elements.ctx.fillStyle = 'green';
        elements.ctx.fillRect(enemy.x, enemy.y - 15, enemy.width * (enemy.health / 100), 5);
    });
}

// Desenhar projéteis
function drawProjectiles() {
    gameState.projectiles.forEach(proj => {
        elements.ctx.fillStyle = proj.color;
        elements.ctx.beginPath();
        elements.ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
        elements.ctx.fill();
    });
}

// Atirar
function handleShoot(e) {
    if (!gameState.gameRunning) return;
    
    const now = Date.now();
    if (now - gameState.lastShot < config.weaponFireRate) return;
    
    gameState.lastShot = now;
    const weapon = gameState.player.weapons[gameState.player.currentWeapon];
    
    if (weapon.ammo <= 0) return;
    if (weapon.ammo !== Infinity) {
        weapon.ammo--;
        updateHUD();
    }
    
    // Criar projétil
    const angle = Math.atan2(
        e.clientY - (gameState.player.y + gameState.player.height/2),
        e.clientX - (gameState.player.x + gameState.player.width/2)
    );
    
    const projectile = {
        x: gameState.player.x + gameState.player.width/2,
        y: gameState.player.y + gameState.player.height/2,
        velocityX: Math.cos(angle) * 10,
        velocityY: Math.sin(angle) * 10,
        width: 10,
        height: 10,
        damage: weapon.damage,
        color: weapon.color
    };
    
    gameState.projectiles.push(projectile);
}

// Atualizar HUD
function updateHUD() {
    // Barra de saúde
    elements.healthBar.style.width = `${gameState.player.health}%`;
    
    // Munição
    const weapon = gameState.player.weapons[gameState.player.currentWeapon];
    elements.ammoDisplay.textContent = `Munição: ${weapon.ammo === Infinity ? '∞' : weapon.ammo}`;
    
    // Missão
    elements.missionDisplay.textContent = `Elimine os aliens: ${gameState.kills}/${config.missionKillsRequired}`;
}

// Game over
function gameOver() {
    gameState.gameRunning = false;
    elements.gameOverText.textContent = `Você eliminou ${gameState.kills} aliens`;
    elements.gameOverScreen.classList.remove('hidden');
}

// Missão completa
function missionComplete() {
    gameState.gameRunning = false;
    alert(`MISSÃO CUMPRIDA! Você eliminou ${gameState.kills} aliens.`);
    showMainMenu();
}

// Mostrar como jogar
function showHowToPlay() {
    alert('CONTROLES:\n\nW/Seta para cima: Pular\nA/D: Movimento lateral\nMouse: Mirar e atirar\n\nOBJETIVO:\n\nElimine 10 aliens para completar a missão!');
}

// Manipuladores de teclado
function handleKeyDown(e) {
    switch(e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft': gameState.keys.a = true; break;
        case 'd':
        case 'arrowright': gameState.keys.d = true; break;
        case 'w':
        case 'arrowup': 
        case ' ':
            if (!gameState.player.isJumping) {
                gameState.player.velocityY = -config.jumpForce;
                gameState.player.isJumping = true;
            }
            break;
        case '1': 
            gameState.player.currentWeapon = 'pistol';
            updateHUD();
            break;
        case '2': 
            gameState.player.currentWeapon = 'rifle';
            updateHUD();
            break;
    }
}

function handleKeyUp(e) {
    switch(e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft': gameState.keys.a = false; break;
        case 'd':
        case 'arrowright': gameState.keys.d = false; break;
    }
}

// Iniciar o jogo quando a página carregar
window.addEventListener('load', init);