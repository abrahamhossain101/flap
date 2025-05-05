// Game variables
let gameStarted = false;
let gameOver = false;
let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let birdX = 100;
let birdY = 300;
let birdVelocity = 0;
let birdGravity = 0.5; // Medium difficulty gravity
let birdFlap = -8;
let pipes = [];
let pipeWidth = 60;
let pipeGap = 150; // Medium difficulty gap
let pipeInterval = 1500; // Medium difficulty pipe spawn interval
let lastPipeTime = 0;
let animationId;
let lastFrameTime = 0;
let soundEnabled = true;
let wingAnimationFrame = 0;
let wingAnimationTimer = 0;
let distance = 0;
let isPaused = false;
const pauseScreen = document.getElementById('pause-screen');
const resumeBtn = document.getElementById('resume-btn');
const distanceDisplay = document.getElementById('distance');

// DOM elements
const gameContainer = document.getElementById('game-container');
const bird = document.getElementById('bird');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreDisplay = document.querySelector('#score-display span');
const bestScoreDisplay = document.getElementById('best-score');
const wingUp = document.getElementById('wing-up');
const wingDown = document.getElementById('wing-down');

// Sound effects
const flapSound = new Audio('https://assets.codepen.io/21542/flap.wav');
const scoreSound = new Audio('https://assets.codepen.io/21542/score.wav');
const hitSound = new Audio('https://assets.codepen.io/21542/hit.wav');

// Set initial bird position
bird.style.left = `${birdX}px`;
bird.style.top = `${birdY}px`;
bestScoreDisplay.textContent = bestScore;

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('touchstart', function(e) {
    e.preventDefault();
    birdJump();
});

// Handle key presses
function handleKeyDown(e) {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && !gameOver) {
        if (!gameStarted) {
            startGame();
        } else {
            flapBird();
        }
    }
    
    // Add 'R' key to restart the game when game over
    if (e.code === 'KeyR' && gameOver) {
        restartGame();
    }
}

// Start the game
function startGame() {
    gameStarted = true;
    gameOver = false;
    score = 0;
    birdY = 300;
    birdVelocity = 0;
    pipes = [];
    lastPipeTime = 0;
    
    startScreen.style.display = 'none';
    scoreDisplay.textContent = score;
    
    // Remove any existing pipes
    document.querySelectorAll('.pipe').forEach(pipe => pipe.remove());
    
    // Start the game loop
    lastFrameTime = performance.now();
    gameLoop(lastFrameTime);
}

// Restart the game
function restartGame() {
    endScreen.style.display = 'none';
    startGame();
}

// Make the bird flap
function flapBird() {
    // Reset velocity to create a stronger upward force
    birdVelocity = birdFlap;
    
    // Play flap sound
    if (soundEnabled) {
        flapSound.currentTime = 0;
        flapSound.play().catch(e => console.log("Audio play failed:", e));
    }
    
    // Add flapping animation
    bird.style.transform = 'rotate(-20deg)';
    
    // Check if wing elements exist before manipulating them
    if (wingUp && wingDown) {
        // Force wing animation to down position
        wingUp.style.display = 'none';
        wingDown.style.display = 'block';
        wingAnimationTimer = 0;
        wingAnimationFrame = 1;
    }
    
    // Reset rotation after a short delay
    setTimeout(() => {
        if (!gameOver) {
            bird.style.transform = 'rotate(0deg)';
        }
    }, 100);
}

// Animate bird wings
function animateWings(deltaTime) {
    // Check if wing elements exist
    if (!wingUp || !wingDown) return;
    
    wingAnimationTimer += deltaTime;
    
    // Change wing state every 150ms when flapping, or every 500ms when gliding
    const interval = birdVelocity < 0 ? 150 : 500;
    
    if (wingAnimationTimer >= interval) {
        wingAnimationTimer = 0;
        wingAnimationFrame = 1 - wingAnimationFrame; // Toggle between 0 and 1
        
        if (wingAnimationFrame === 0) {
            wingUp.style.display = 'block';
            wingDown.style.display = 'none';
        } else {
            wingUp.style.display = 'none';
            wingDown.style.display = 'block';
        }
    }
}

// Create a new pipe
function createPipe(timestamp) {
    if (timestamp - lastPipeTime > pipeInterval) {
        lastPipeTime = timestamp;
        
        // Random height for top pipe (between 50px and 300px)
        const topHeight = Math.floor(Math.random() * 250) + 50;
        const bottomHeight = gameContainer.clientHeight - topHeight - pipeGap;
        
        // Create top pipe
        const topPipe = document.createElement('div');
        topPipe.className = 'pipe';
        topPipe.style.height = `${topHeight}px`;
        topPipe.style.left = `${gameContainer.clientWidth}px`;
        topPipe.style.top = '0';
        topPipe.style.width = `${pipeWidth}px`;
        
        // Add pipe cap to top pipe
        const topPipeCap = document.createElement('div');
        topPipeCap.style.width = `${pipeWidth + 10}px`;
        topPipeCap.style.height = '20px';
        topPipeCap.style.backgroundColor = '#218B22';
        topPipeCap.style.position = 'absolute';
        topPipeCap.style.bottom = '0';
        topPipeCap.style.left = '-5px';
        topPipeCap.style.borderRadius = '4px';
        topPipe.appendChild(topPipeCap);
        
        // Create bottom pipe
        const bottomPipe = document.createElement('div');
        bottomPipe.className = 'pipe';
        bottomPipe.style.height = `${bottomHeight}px`;
        bottomPipe.style.left = `${gameContainer.clientWidth}px`;
        bottomPipe.style.bottom = '0';
        bottomPipe.style.width = `${pipeWidth}px`;
        
        // Add pipe cap to bottom pipe
        const bottomPipeCap = document.createElement('div');
        bottomPipeCap.style.width = `${pipeWidth + 10}px`;
        bottomPipeCap.style.height = '20px';
        bottomPipeCap.style.backgroundColor = '#218B22';
        bottomPipeCap.style.position = 'absolute';
        bottomPipeCap.style.top = '0';
        bottomPipeCap.style.left = '-5px';
        bottomPipeCap.style.borderRadius = '4px';
        bottomPipe.appendChild(bottomPipeCap);
        
        // Add pipes to the game
        gameContainer.appendChild(topPipe);
        gameContainer.appendChild(bottomPipe);
        
        // Add pipes to the array
        pipes.push({
            top: topPipe,
            bottom: bottomPipe,
            x: gameContainer.clientWidth,
            passed: false
        });
    }
}

// Update pipe positions
function updatePipes(deltaTime) {
    // Fixed pipe speed instead of using difficultySettings
    const pipeSpeed = 3 * (deltaTime / 16); // Medium difficulty pipe speed
    
    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        pipe.x -= pipeSpeed;
        
        pipe.top.style.left = `${pipe.x}px`;
        pipe.bottom.style.left = `${pipe.x}px`;
        
        // Check if bird passed the pipe
        if (!pipe.passed && pipe.x + pipeWidth < birdX) {
            pipe.passed = true;
            score++;
            scoreDisplay.textContent = score;
            
            // Play score sound
            if (soundEnabled) {
                scoreSound.currentTime = 0;
                scoreSound.play().catch(e => console.log("Audio play failed:", e));
            }
            
            // Add score animation
            scoreDisplay.classList.add('text-yellow-300', 'scale-125');
            setTimeout(() => {
                scoreDisplay.classList.remove('text-yellow-300', 'scale-125');
            }, 200);
        }
        
        // Remove pipes that are off-screen
        if (pipe.x + pipeWidth < 0) {
            gameContainer.removeChild(pipe.top);
            gameContainer.removeChild(pipe.bottom);
            pipes.splice(i, 1);
            i--;
        }
    }
}

// Game loop
function gameLoop(timestamp) {
    try {
        // Calculate delta time for smooth animation
        const deltaTime = Math.min(timestamp - lastFrameTime, 50); // Cap delta time to prevent large jumps
        lastFrameTime = timestamp;
        
        // Update bird position with more immediate response
        birdVelocity += birdGravity * (deltaTime / 16); // Scale with frame time
        birdY += birdVelocity * (deltaTime / 16); // Scale with frame time
        
        // Ensure bird position is valid
        if (isNaN(birdY)) {
            birdY = 300;
            birdVelocity = 0;
        }
        
        // Update bird element position
        bird.style.top = `${birdY}px`;
        
        // Rotate bird based on velocity (more responsive rotation)
        const rotation = Math.min(Math.max(birdVelocity * 2, -30), 90); // Limit rotation angles
        bird.style.transform = `rotate(${rotation}deg)`;
        
        // Animate wings
        animateWings(deltaTime);
        
        // Create and update pipes
        createPipe(timestamp);
        updatePipes(deltaTime);
        
        // Check for collisions
        if (checkCollisions()) {
            endGame();
            return;
        }
        
        // Continue game loop
        animationId = requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error("Game loop error:", error);
        // Try to recover
        setTimeout(() => {
            if (gameStarted && !gameOver) {
                animationId = requestAnimationFrame(gameLoop);
            }
        }, 1000);
    }
}

// Check for collisions
function checkCollisions() {
    // Ensure bird position is valid
    if (isNaN(birdY)) {
        birdY = 300; // Reset to a safe value
    }
    
    const birdRect = {
        left: birdX,
        right: birdX + 40,
        top: birdY,
        bottom: birdY + 30
    };
    
    // Check collision with ground or ceiling
    if (birdY <= 0 || birdY + 30 >= gameContainer.clientHeight) {
        return true;
    }
    
    // Check collision with pipes
    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        
        // Skip if pipe is not properly initialized
        if (!pipe || !pipe.top || !pipe.bottom) continue;
        
        const pipeLeftX = pipe.x;
        const pipeRightX = pipe.x + pipeWidth;
        
        // Only check pipes that are near the bird
        if (pipeRightX >= birdX - 10 && pipeLeftX <= birdX + 40) {
            // Get pipe heights, with error handling
            let topPipeBottom = 0;
            let bottomPipeTop = gameContainer.clientHeight;
            
            try {
                topPipeBottom = parseInt(pipe.top.style.height) || 0;
                bottomPipeTop = gameContainer.clientHeight - (parseInt(pipe.bottom.style.height) || 0);
            } catch (e) {
                console.log("Error parsing pipe heights:", e);
                continue;
            }
            
            // Check if bird collides with top pipe
            if (birdY <= topPipeBottom) {
                return true;
            }
            
            // Check if bird collides with bottom pipe
            if (birdY + 30 >= bottomPipeTop) {
                return true;
            }
        }
    }
    
    return false;
}

// End the game
function endGame() {
    gameOver = true;
    gameStarted = false;
    
    // Play hit sound
    if (soundEnabled) {
        hitSound.currentTime = 0;
        hitSound.play().catch(e => console.log("Audio play failed:", e));
    }
    
    // Update best score
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('bestScore', bestScore);
        bestScoreDisplay.textContent = bestScore;
    }
    
    // Show end screen
    finalScoreDisplay.textContent = score;
    endScreen.style.display = 'flex';
    
    // Add restart instruction
    const restartInstructions = document.querySelector('#end-screen .mt-8');
    if (restartInstructions) {
        restartInstructions.innerHTML = `
            <p>Best Score: <span id="best-score" class="text-yellow-300">${bestScore}</span></p>
            <p class="mt-2 text-white">Press <span class="text-yellow-300">R</span> to restart</p>
        `;
    }
    
    // Cancel animation frame
    cancelAnimationFrame(animationId);
}

// Initialize game
function init() {
    try {
        // Position score display to avoid pipes
        scoreDisplay.style.zIndex = "5";
        scoreDisplay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        scoreDisplay.style.padding = "5px 10px";
        scoreDisplay.style.borderRadius = "10px";
        
        // Check if wing elements exist
        if (!wingUp || !wingDown) {
            console.warn("Wing elements not found. Bird animation may not work properly.");
        } else {
            // Initialize wing display
            wingUp.style.display = 'block';
            wingDown.style.display = 'none';
        }
        
        // Remove difficulty and sound options from start screen
        const difficultyOption = document.getElementById('difficulty');
        const soundOption = document.getElementById('sound-toggle');
        const optionsDiv = document.querySelector('#start-screen .options');
        
        if (difficultyOption) {
            difficultyOption.parentElement.style.display = 'none';
        }
        
        if (soundOption) {
            soundOption.parentElement.style.display = 'none';
        }
        
        if (optionsDiv) {
            optionsDiv.style.display = 'none';
        }
    } catch (error) {
        console.error("Initialization error:", error);
    }
}

// Initialize the game
init();