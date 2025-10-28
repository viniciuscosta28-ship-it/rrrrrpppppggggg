// ===================================
// ELEMENTOS DO DOM
// ===================================

const player = document.getElementById('player');
const playerInfo = document.getElementById('player-info');
const gameWorld = document.getElementById('game-world');

// ===================================
// CONFIGURAÇÃO DO PERSONAGEM
// ===================================

let character = {
    nome: "Claudio",
    classe: "cadeirante",
    vida: 100,
    vidaMaxima: 100,
    nivel: 1,
    experiencia: 0,
    emoji: "🧑🏻‍🦽"
};

// ===================================
// VARIÁVEIS DE POSIÇÃO E MOVIMENTO
// ===================================

let playerX = 50;
let playerY = 180;
let playerSpeed = 10;
let lastDirection = 'right';

// ===================================
// SISTEMA DE FASES
// ===================================

let currentLevel = 1;
let itemsCollected = 0;
let enemiesDefeated = 0;
let levelStartTime = Date.now();
let exitDoor = null;
let hasKey = false;

const levels = {
    1: {
        nome: "Floresta dos Iniciantes",
        objetivo: "Colete 3 itens",
        backgroundColor: "#2d4a2e",
        itemsNeeded: 3
    },
    2: {
        nome: "Caverna Sombria",
        objetivo: "Sobreviva por 30 segundos",
        backgroundColor: "#1a1a2e",
        timeLimit: 30
    },
    3: {
        nome: "Castelo Final",
        objetivo: "Encontre a saída!",
        backgroundColor: "#4a2d2d",
        hasExit: true
    }
};

// ===================================
// SISTEMA DE ITENS E INIMIGOS
// ===================================

let items = [];
let enemies = [];

// ===================================
// SISTEMA DE INVENTÁRIO
// ===================================

let inventory = [];
let maxInventorySize = 10;

// ===================================
// SISTEMA DE HABILIDADES
// ===================================

let abilities = {
    attack: {
        nome: "Ataque Especial",
        cooldown: 3000,
        lastUsed: 0,
        dano: 30,
        alcance: 80,
        tecla: "Space"
    },
    dash: {
        nome: "Corrida Rápida",
        cooldown: 5000,
        lastUsed: 0,
        distancia: 60,
        tecla: "Shift"
    }
};

// ===================================
// SISTEMA DE SONS
// ===================================

const sounds = {
    collect: function() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.2);
        } catch(e) {
            console.log("Áudio não disponível");
        }
    },
    
    damage: function() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = 200;
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
        } catch(e) {
            console.log("Áudio não disponível");
        }
    },
    
    levelUp: function() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.5);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
        } catch(e) {
            console.log("Áudio não disponível");
        }
    }
};

// ===================================
// INICIALIZAÇÃO DO PERSONAGEM
// ===================================

function initializePlayer() {
    player.innerHTML = character.emoji;
    player.style.fontSize = "30px";
    player.style.display = "flex";
    player.style.alignItems = "center";
    player.style.justifyContent = "center";
}

// ===================================
// MOVIMENTO DO PERSONAGEM
// ===================================

function movePlayer(direction) {
    if (direction === 'up') {
        playerY -= playerSpeed;
    } else if (direction === 'down') {
        playerY += playerSpeed;
    } else if (direction === 'left') {
        playerX -= playerSpeed;
    } else if (direction === 'right') {
        playerX += playerSpeed;
    }

    // Limites da tela
    if (playerX < 0) playerX = 0;
    if (playerX > 760) playerX = 760;
    if (playerY < 0) playerY = 0;
    if (playerY > 360) playerY = 360;

    // Atualiza posição na tela
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';

    // Verifica colisões e coletas
    checkItemCollection();
    updateInfoPanel();
}

// ===================================
// EFEITOS VISUAIS
// ===================================

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.position = 'absolute';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.width = '5px';
        particle.style.height = '5px';
        particle.style.background = color;
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        
        const angle = (Math.PI * 2 * i) / count;
        const velocity = 2 + Math.random() * 2;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        gameWorld.appendChild(particle);
        
        let posX = x;
        let posY = y;
        let life = 30;
        
        const animateParticle = setInterval(function() {
            posX += vx;
            posY += vy;
            life--;
            
            particle.style.left = posX + 'px';
            particle.style.top = posY + 'px';
            particle.style.opacity = life / 30;
            
            if (life <= 0) {
                particle.remove();
                clearInterval(animateParticle);
            }
        }, 16);
    }
}

// ===================================
// SISTEMA DE LEVEL UP
// ===================================

function checkLevelUp() {
    let expNecessaria = character.nivel * 100;
    
    if (character.experiencia >= expNecessaria) {
        character.nivel++;
        character.experiencia -= expNecessaria;
        character.vidaMaxima += 20;
        character.vida = character.vidaMaxima;
        
        sounds.levelUp();
        createParticles(playerX + 20, playerY + 20, '#FFD700', 12);
        
        console.log("🎊 LEVEL UP! Agora você é nível " + character.nivel);
    }
}

// ===================================
// SISTEMA DE ITENS
// ===================================

function createItems() {
    items.forEach(function(item, index) {
        const itemElement = document.createElement('div');
        itemElement.id = 'item-' + index;
        itemElement.style.position = 'absolute';
        itemElement.style.left = item.x + 'px';
        itemElement.style.top = item.y + 'px';
        itemElement.style.fontSize = '30px';
        itemElement.innerHTML = item.emoji;
        
        gameWorld.appendChild(itemElement);
    });
}

function checkItemCollection() {
    items.forEach(function(item, index) {
        let distanceX = Math.abs(playerX - item.x);
        let distanceY = Math.abs(playerY - item.y);
        
        if (distanceX < 40 && distanceY < 40) {
            // Efeitos visuais e sonoros
            sounds.collect();
            createParticles(item.x + 20, item.y + 20, '#FFD700', 8);
            
            if (item.tipo === "cura") {
                character.vida += 30;
                if (character.vida > character.vidaMaxima) {
                    character.vida = character.vidaMaxima;
                }
                console.log("❤️ Vida restaurada!");
            } else if (item.tipo === "chave") {
                hasKey = true;
                character.experiencia += item.valor;
                itemsCollected++;
                addToInventory(item);
                console.log("🔑 CHAVE COLETADA! Agora você pode abrir a porta!");
            } else {
                character.experiencia += item.valor;
                itemsCollected++;
                addToInventory(item);
            }
            
            const itemElement = document.getElementById('item-' + index);
            if (itemElement) {
                itemElement.remove();
            }
            
            items.splice(index, 1);
            console.log("🎉 Coletou: " + item.emoji);
            
            checkLevelUp();
            checkLevelComplete();
        }
    });
}

// ===================================
// SISTEMA DE INVENTÁRIO
// ===================================

function addToInventory(item) {
    if (inventory.length < maxInventorySize) {
        inventory.push({
            tipo: item.tipo,
            emoji: item.emoji,
            nome: item.tipo.toUpperCase()
        });
        console.log("📦 Adicionado ao inventário: " + item.emoji);
        updateInventoryDisplay();
        return true;
    } else {
        console.log("⚠️ Inventário cheio!");
        return false;
    }
}

function updateInventoryDisplay() {
    let inventoryPanel = document.getElementById('inventory-panel');
    
    if (!inventoryPanel) {
        inventoryPanel = document.createElement('div');
        inventoryPanel.id = 'inventory-panel';
        document.getElementById('info-panel').appendChild(inventoryPanel);
    }
    
    let inventoryHTML = '<strong>🎒 Inventário (' + inventory.length + '/' + maxInventorySize + '):</strong> ';
    
    if (inventory.length === 0) {
        inventoryHTML += '<em>Vazio</em>';
    } else {
        inventory.forEach(function(item) {
            inventoryHTML += item.emoji + ' ';
        });
    }
    
    inventoryPanel.innerHTML = inventoryHTML;
}

// ===================================
// SISTEMA DE INIMIGOS
// ===================================

function createEnemies() {
    enemies.forEach(function(enemy, index) {
        const enemyElement = document.createElement('div');
        enemyElement.id = 'enemy-' + index;
        enemyElement.className = 'enemy';
        enemyElement.style.position = 'absolute';
        enemyElement.style.left = enemy.x + 'px';
        enemyElement.style.top = enemy.y + 'px';
        enemyElement.style.fontSize = '30px';
        enemyElement.innerHTML = enemy.emoji;
        
        gameWorld.appendChild(enemyElement);
    });
}

function moveEnemies() {
    enemies.forEach(function(enemy, index) {
        enemy.x += enemy.velocidade * enemy.direcao;
        
        if (enemy.x <= 0 || enemy.x >= 760) {
            enemy.direcao *= -1;
        }
        
        const enemyElement = document.getElementById('enemy-' + index);
        if (enemyElement) {
            enemyElement.style.left = enemy.x + 'px';
        }
    });
}

function checkEnemyCollision() {
    enemies.forEach(function(enemy) {
        let distanceX = Math.abs(playerX - enemy.x);
        let distanceY = Math.abs(playerY - enemy.y);
        
        if (distanceX < 40 && distanceY < 40) {
            character.vida -= enemy.dano;
            
            sounds.damage();
            
            playerX -= enemy.direcao * 50;
            if (playerX < 0) playerX = 0;
            if (playerX > 760) playerX = 760;
            
            player.style.left = playerX + 'px';
            
            player.style.background = '#ff0000';
            setTimeout(function() {
                player.style.background = '#ff6b6b';
            }, 200);
            
            console.log("💥 Recebeu " + enemy.dano + " de dano!");
            
            if (character.vida <= 0) {
                gameOver();
            }
            
            updateInfoPanel();
        }
    });
}

// ===================================
// SISTEMA DE HABILIDADES
// ===================================

function useAttack() {
    const now = Date.now();
    const ability = abilities.attack;
    
    if (now - ability.lastUsed < ability.cooldown) {
        const timeLeft = Math.ceil((ability.cooldown - (now - ability.lastUsed)) / 1000);
        console.log("⏳ Aguarde " + timeLeft + "s para atacar novamente");
        return;
    }
    
    ability.lastUsed = now;
    console.log("⚔️ ATAQUE ESPECIAL!");
    
    createAttackEffect();
    
    enemies.forEach(function(enemy, index) {
        let distanceX = Math.abs(playerX - enemy.x);
        let distanceY = Math.abs(playerY - enemy.y);
        
        if (distanceX < ability.alcance && distanceY < ability.alcance) {
            const enemyElement = document.getElementById('enemy-' + index);
            if (enemyElement) {
                enemyElement.innerHTML = "💥";
                setTimeout(function() {
                    enemyElement.remove();
                }, 300);
            }
            
            enemies.splice(index, 1);
            character.experiencia += 50;
            enemiesDefeated++;
            
            console.log("💀 Inimigo derrotado! +50 EXP");
            checkLevelUp();
        }
    });
}

function useDash(direction) {
    const now = Date.now();
    const ability = abilities.dash;
    
    if (now - ability.lastUsed < ability.cooldown) {
        const timeLeft = Math.ceil((ability.cooldown - (now - ability.lastUsed)) / 1000);
        console.log("⏳ Aguarde " + timeLeft + "s para correr novamente");
        return;
    }
    
    ability.lastUsed = now;
    console.log("💨 DASH!");
    
    if (direction === 'up') {
        playerY -= ability.distancia;
    } else if (direction === 'down') {
        playerY += ability.distancia;
    } else if (direction === 'left') {
        playerX -= ability.distancia;
    } else if (direction === 'right') {
        playerX += ability.distancia;
    }
    
    if (playerX < 0) playerX = 0;
    if (playerX > 760) playerX = 760;
    if (playerY < 0) playerY = 0;
    if (playerY > 360) playerY = 360;
    
    player.style.transition = 'all 0.2s';
    player.style.transform = 'scale(1.2)';
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';
    
    setTimeout(function() {
        player.style.transform = 'scale(1)';
        player.style.transition = 'all 0.1s';
    }, 200);
}

function createAttackEffect() {
    const effect = document.createElement('div');
effect.style.position = 'absolute';
    effect.style.left = (playerX - 20) + 'px';
    effect.style.top = (playerY - 20) + 'px';
    effect.style.width = '80px';
    effect.style.height = '80px';
    effect.style.border = '3px solid yellow';
    effect.style.borderRadius = '50%';
    effect.style.pointerEvents = 'none';
    effect.style.animation = 'attack-pulse 0.5s ease-out';
    
    gameWorld.appendChild(effect);
    
    setTimeout(function() {
        effect.remove();
    }, 500);
}

// ===================================
// SISTEMA DE FASES
// ===================================

function startLevel(levelNumber) {
    currentLevel = levelNumber;
    const level = levels[levelNumber];
    
    items = [];
    enemies = [];
    itemsCollected = 0;
    hasKey = false;
    
    document.querySelectorAll('.enemy, [id^="item-"], #exit-door').forEach(el => el.remove());
    
    gameWorld.style.background = level.backgroundColor;
    
    playerX = 50;
    playerY = 180;
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';
    
    console.log("🎮 Fase " + levelNumber + ": " + level.nome);
    console.log("🎯 Objetivo: " + level.objetivo);
    
    if (levelNumber === 1) {
        setupLevel1();
    } else if (levelNumber === 2) {
        setupLevel2();
    } else if (levelNumber === 3) {
        setupLevel3();
    }
    
    updateInfoPanel();
}

function setupLevel1() {
    items = [
        { x: 200, y: 100, tipo: "moeda", emoji: "💰", valor: 10 },
        { x: 400, y: 200, tipo: "poção", emoji: "🧪", valor: 20 },
        { x: 600, y: 150, tipo: "estrela", emoji: "⭐", valor: 50 },
        { x: 300, y: 300, tipo: "diamante", emoji: "💎", valor: 30 }
    ];
    
    enemies = [
        { x: 350, y: 100, direcao: 1, velocidade: 2, emoji: "🐛", dano: 5 }
    ];
    
    createItems();
    createEnemies();
}

function setupLevel2() {
    levelStartTime = Date.now();
    
    items = [
        { x: 150, y: 150, tipo: "cura", emoji: "❤️", valor: 0 },
        { x: 650, y: 250, tipo: "cura", emoji: "❤️", valor: 0 }
    ];
    
    enemies = [
        { x: 300, y: 100, direcao: 1, velocidade: 3, emoji: "🦇", dano: 30 },
        { x: 500, y: 250, direcao: -1, velocidade: 4, emoji: "👻", dano: 50 },
        { x: 200, y: 300, direcao: 1, velocidade: 2, emoji: "🕷️", dano: 25 }
    ];
    
    createItems();
    createEnemies();
}

function setupLevel3() {
    items = [
        { x: 300, y: 100, tipo: "chave", emoji: "🔑", valor: 100 }
    ];
    
    enemies = [
        { x: 200, y: 150, direcao: 1, velocidade: 2, emoji: "🐉", dano: 20 },
        { x: 600, y: 200, direcao: -1, velocidade: 3, emoji: "⚔️", dano: 18 }
    ];
    
    createItems();
    createEnemies();
    createExitDoor();
}

function createExitDoor() {
    exitDoor = { x: 700, y: 300 };
    
    const doorElement = document.createElement('div');
    doorElement.id = 'exit-door';
    doorElement.style.position = 'absolute';
    doorElement.style.left = exitDoor.x + 'px';
    doorElement.style.top = exitDoor.y + 'px';
    doorElement.style.fontSize = '40px';
    doorElement.innerHTML = '🚪';
    
    gameWorld.appendChild(doorElement);
}

function checkLevelComplete() {
    const level = levels[currentLevel];
    
    if (currentLevel === 1 && itemsCollected >= level.itemsNeeded) {
        alert("🎉 Fase 1 Completa! Você coletou todos os itens!");
        startLevel(2);
        return;
    }
    
    if (currentLevel === 2) {
        let timeElapsed = (Date.now() - levelStartTime) / 1000;
        if (timeElapsed >= level.timeLimit) {
            alert("🎉 Fase 2 Completa! Você sobreviveu!");
            startLevel(3);
            return;
        }
    }
    
    if (currentLevel === 3 && exitDoor) {
        let distanceX = Math.abs(playerX - exitDoor.x);
        let distanceY = Math.abs(playerY - exitDoor.y);
        
        if (distanceX < 40 && distanceY < 40) {
            if (hasKey) {
                alert("🏆 PARABÉNS! Você completou TODAS as fases!\n\n🔑 Você usou a chave e escapou!\n⭐ Pontuação Final: " + character.experiencia + " EXP");
                location.reload();
            } else {
                alert("🚪 A porta está trancada! Você precisa encontrar a CHAVE 🔑 primeiro!");
                console.log("⚠️ Procure pela chave 🔑 antes de tentar abrir a porta!");
            }
        }
    }
}

// ===================================
// ATUALIZAÇÃO DO PAINEL DE INFORMAÇÕES
// ===================================

function updateInfoPanel() {
    const level = levels[currentLevel];
    let objetivoText = level.objetivo;
    
    if (currentLevel === 1) {
        objetivoText += ` (${itemsCollected}/${level.itemsNeeded})`;
    } else if (currentLevel === 2) {
        let timeLeft = level.timeLimit - Math.floor((Date.now() - levelStartTime) / 1000);
        if (timeLeft < 0) timeLeft = 0;
        objetivoText += ` (${timeLeft}s restantes)`;
    } else if (currentLevel === 3) {
        if (hasKey) {
            objetivoText += " ✅ Chave coletada!";
        } else {
            objetivoText += " 🔑 Encontre a chave primeiro!";
        }
    }
    
    playerInfo.innerHTML = `
        <strong>🎮 Fase ${currentLevel}:</strong> ${level.nome}<br>
        <strong>🎯 Objetivo:</strong> ${objetivoText}<br>
        <strong>${character.nome}</strong> (${character.classe}) - Nível ${character.nivel}<br>
        ❤️ Vida: ${character.vida}/${character.vidaMaxima} | 
        ⭐ EXP: ${character.experiencia} | 
        📍 X: ${playerX}, Y: ${playerY}
    `;
}

// ===================================
// GAME OVER
// ===================================

function gameOver() {
    character.vida = 0;
    alert("💀 GAME OVER! Você foi derrotado...\n\nPontuação final: " + character.experiencia + " EXP");
    location.reload();
}

// ===================================
// LOOP PRINCIPAL DO JOGO
// ===================================

function gameLoop() {
    moveEnemies();
    checkEnemyCollision();
    
    if (currentLevel === 2) {
        checkLevelComplete();
    }
    
    updateInfoPanel();
}

// ===================================
// CONTROLES DO TECLADO
// ===================================

document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowUp') {
        movePlayer('up');
        lastDirection = 'up';
    } else if (event.key === 'ArrowDown') {
        movePlayer('down');
        lastDirection = 'down';
    } else if (event.key === 'ArrowLeft') {
        movePlayer('left');
        lastDirection = 'left';
    } else if (event.key === 'ArrowRight') {
        movePlayer('right');
        lastDirection = 'right';
    } else if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        useAttack();
    } else if (event.key === 'Shift') {
        useDash(lastDirection);
    }
});

// ===================================
// INICIALIZAÇÃO DO JOGO
// ===================================

console.log("🎮 Iniciando jogo...");
console.log("===================================");

initializePlayer();
updateInventoryDisplay();
startLevel(1);

// Inicia o loop do jogo (30 FPS)
setInterval(gameLoop, 1000 / 30);

console.log("✅ Jogo carregado com sucesso!");
console.log("===================================");
console.log("🎯 CONTROLES:");
console.log("   ⬆️⬇️⬅️➡️ = Mover");
console.log("   ESPAÇO = Atacar");
console.log("   SHIFT = Dash");
console.log("===================================");
console.log("Boa sorte, aventureiro! 🗡️");
