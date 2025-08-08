// Configurações do jogo
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Elementos da interface
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const highscoresBtn = document.getElementById('highscores-btn');
const backToMenuBtn = document.getElementById('back-to-menu');
const saveScoreBtn = document.getElementById('save-score');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const levelDisplay = document.getElementById('level');
const weaponDisplay = document.getElementById('weapon');
const enemiesRemainingDisplay = document.getElementById('enemies-remaining');
const gameOverScreen = document.getElementById('game-over');
const levelCompleteScreen = document.getElementById('level-complete');
const highscoresScreen = document.getElementById('highscores-screen');
const finalScoreDisplay = document.getElementById('final-score');
const bonusScoreDisplay = document.getElementById('bonus-score');
const newHighscoreDiv = document.getElementById('new-highscore');
const playerNameInput = document.getElementById('player-name');
const highscoresList = document.getElementById('highscores-list');
const gameMusic = document.getElementById('game-music');

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
let particles = [];
let boss = null;
let enemiesInWave = 0;
let enemiesKilledInWave = 0;
let lastEnemySpawn = 0;
let lastBossSpawn = 0;
let gameTime = 0;
let keys = {};
let backgroundOffset = 0;
let weaponType = 'basic';
let weaponLevel = 1;
let weaponTimer = 0;
let highscores = JSON.parse(localStorage.getItem('spaceShooterHighscores')) || [];
let backgroundStars = [];

// Configuração de controles
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Botões do menu
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
highscoresBtn.addEventListener('click', showHighscores);
backToMenuBtn.addEventListener('click', hideHighscores);
saveScoreBtn.addEventListener('click', saveHighscore);

// Inicializar estrelas de fundo
function initBackgroundStars() {
    backgroundStars = [];
    for (let i = 0; i < 200; i++) {
        backgroundStars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5,
            speed: 0.2 + Math.random() * 0.8,
            alpha: 0.1 + Math.random() * 0.9
        });
    }
}

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
    particles = [];
    boss = null;
    enemiesInWave = 0;
    enemiesKilledInWave = 0;
    weaponType = 'basic';
    weaponLevel = 1;
    weaponTimer = 0;
    
    // Resetar posição do jogador
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 80;
    player.invincible = true;
    player.invincibleTimer = 120; // 2 segundos de invencibilidade
    
    // Inicializar fundo
    initBackgroundStars();
    
    // Atualizar interface
    updateHUD();
    
    // Esconder telas de menu
    gameOverScreen.classList.add('hidden');
    levelCompleteScreen.classList.add('hidden');
    highscoresScreen.classList.add('hidden');
    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
    
    // Iniciar música
    gameMusic.volume = 0.3;
    gameMusic.play().catch(e => console.log("Audio error"));
    
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
    if (keys['arrowleft'] || keys['a']) player.x = Math.max(0, player.x - player.speed);
    if (keys['arrowright'] || keys['d']) player.x = Math.min(canvas.width - player.width, player.x + player.speed);
    if (keys['arrowup'] || keys['w']) player.y = Math.max(0, player.y - player.speed);
    if (keys['arrowdown'] || keys['s']) player.y = Math.min(canvas.height - player.height, player.y + player.speed);
    
    // Disparo do jogador
    if ((keys[' '] || keys['x']) && player.canShoot) {
        shoot();
        player.canShoot = false;
        player.cooldown = getWeaponCooldown();
    }
    
    // Atualizar cooldown do tiro
    if (player.cooldown > 0) {
        player.cooldown--;
        if (player.cooldown === 0) {
            player.canShoot = true;
        }
    }
    
    // Atualizar temporizador de arma especial
    if (weaponType !== 'basic' && weaponTimer > 0) {
        weaponTimer--;
        if (weaponTimer === 0) {
            weaponType = 'basic';
            weaponLevel = 1;
            weaponDisplay.textContent = 'Básica';
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
    
    // Atualizar partículas
    updateParticles();
    
    // Atualizar chefão
    updateBoss();
    
    // Atualizar power-ups
    updatePowerUps();
    
    // Verificar colisões
    checkCollisions();
    
    // Verificar fim de fase
    checkLevelComplete();
    
    // Atualizar fundo
    updateBackground();
}

// Renderizar o jogo
function render() {
    // Limpar tela
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar fundo
    drawBackground();
    
    // Desenhar power-ups
    drawPowerUps();
    
    // Desenhar inimigos
    drawEnemies();
    
    // Desenhar balas inimigas
    drawEnemyBullets();
    
    // Desenhar balas do jogador
    drawBullets();
    
    // Desenhar chefão
    drawBoss();
    
    // Desenhar jogador
    drawPlayer();
    
    // Desenhar explosões
    drawExplosions();
    
    // Desenhar partículas
    drawParticles();
}

// Funções de desenho específicas
function drawBackground() {
    // Gradiente para efeito de espaço
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000033');
    gradient.addColorStop(1, '#000011');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrelas
    ctx.fillStyle = '#fff';
    backgroundStars.forEach(star => {
        ctx.globalAlpha = star.alpha;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1;
    
    // Nebulosa
    const nebulaGradient = ctx.createRadialGradient(
        canvas.width / 3, canvas.height / 2, 50,
        canvas.width / 3, canvas.height / 2, 300
    );
    nebulaGradient.addColorStop(0, 'rgba(68, 34, 153, 0.8)');
    nebulaGradient.addColorStop(1, 'rgba(68, 34, 153, 0)');
    ctx.fillStyle = nebulaGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    if (!player.invincible || Math.floor(gameTime / 10) % 2 === 0) {
        ctx.save();
        ctx.fillStyle = player.color;
        
        // Forma da nave
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.closePath();
        ctx.fill();
        
        // Detalhes da nave
        ctx.fillStyle = '#8cf';
        ctx.fillRect(player.x + player.width / 2 - 5, player.y + 10, 10, 10);
        
        ctx.restore();
    }
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.save();
        ctx.fillStyle = enemy.color;
        
        // Corpo do inimigo
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
        ctx.lineTo(enemy.x + enemy.width, enemy.y);
        ctx.lineTo(enemy.x, enemy.y);
        ctx.closePath();
        ctx.fill();
        
        // Detalhes do inimigo
        ctx.fillStyle = enemy.type === 'elite' ? '#f80' : '#f00';
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Barra de vida para inimigos elite
        if (enemy.type === 'elite' && enemy.health < enemy.maxHealth) {
            const healthWidth = (enemy.width - 10) * (enemy.health / enemy.maxHealth);
            ctx.fillStyle = '#f00';
            ctx.fillRect(enemy.x + 5, enemy.y - 10, enemy.width - 10, 3);
            ctx.fillStyle = '#0f0';
            ctx.fillRect(enemy.x + 5, enemy.y - 10, healthWidth, 3);
        }
        
        ctx.restore();
    });
}

// ... (continua com todas as outras funções de desenho e atualização)

// Função para mostrar recordes
function showHighscores() {
    highscoresScreen.classList.remove('hidden');
    updateHighscoresList();
}

function hideHighscores() {
    highscoresScreen.classList.add('hidden');
}

function updateHighscoresList() {
    highscoresList.innerHTML = '';
    highscores.slice(0, 10).forEach((score, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${index + 1}. ${score.name}</span><span>${score.score}</span>`;
        highscoresList.appendChild(li);
    });
}

function saveHighscore() {
    const name = playerNameInput.value.trim() || 'Anônimo';
    highscores.push({ name, score });
    highscores.sort((a, b) => b.score - a.score);
    highscores = highscores.slice(0, 10);
    localStorage.setItem('spaceShooterHighscores', JSON.stringify(highscores));
    newHighscoreDiv.classList.add('hidden');
    updateHighscoresList();
}

// Inicializar estrelas de fundo
initBackgroundStars();

// Mostrar menu principal
startBtn.style.display = 'inline-block';