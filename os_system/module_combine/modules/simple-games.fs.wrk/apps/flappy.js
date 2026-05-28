// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: NONE
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowTitleSet("Flappy");
	// DOM Translation
	document.head.innerHTML = `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
<style>
	* {
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	body {
		margin: 0;
		min-height: 100vh;
		background: linear-gradient(145deg, #0b2b3f 0%, #1a4a6f 100%);
		display: flex;
		justify-content: center;
		align-items: center;
		font-family: 'Courier New', 'VT323', monospace;
		touch-action: manipulation;
	}

	/* main game container - fits both desktop and phone */
	.game-container {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 12px;
		box-sizing: border-box;
		width: 100%;
		height: 100vh;
		max-height: 100vh;
	}

	canvas {
		display: block;
		margin: 0 auto;
		box-shadow: 0 20px 35px rgba(0, 0, 0, 0.4), 0 0 0 3px #f9e7b3, 0 0 0 6px #6b3e1c;
		border-radius: 18px;
		cursor: pointer;
		background-color: #70c5ce;
		width: auto;
		height: auto;
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}

	/* UI overlay for pause / score & messages */
	.info-panel {
		position: fixed;
		top: 15px;
		left: 0;
		right: 0;
		text-align: center;
		pointer-events: none;
		z-index: 10;
		font-weight: bold;
		text-shadow: 2px 2px 0 #00000055;
	}

	.score-board {
		display: inline-block;
		background: #000000aa;
		backdrop-filter: blur(5px);
		padding: 8px 20px;
		border-radius: 60px;
		color: white;
		font-size: 2.2rem;
		font-weight: bold;
		letter-spacing: 2px;
		font-family: monospace;
		border: 1px solid gold;
	}

	.pause-btn-container {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 20;
		pointer-events: auto;
	}

	.pause-btn {
		background: #2c2e3e;
		border: none;
		color: white;
		font-size: 1.6rem;
		font-weight: bold;
		padding: 12px 22px;
		border-radius: 60px;
		cursor: pointer;
		font-family: monospace;
		box-shadow: 0 6px 0 #121212;
		transition: 0.07s linear;
		touch-action: manipulation;
		backdrop-filter: blur(4px);
		background: #1e2a32cc;
		border: 1px solid #ffd966;
	}

	.pause-btn:active {
		transform: translateY(3px);
		box-shadow: 0 2px 0 #121212;
	}

	.restart-hint {
		position: fixed;
		bottom: 20px;
		left: 20px;
		background: #00000099;
		backdrop-filter: blur(4px);
		padding: 6px 14px;
		border-radius: 40px;
		color: #ddd;
		font-size: 0.8rem;
		font-family: monospace;
		pointer-events: none;
		z-index: 10;
		font-weight: bold;
	}

	@media (max-width: 600px) {
		.score-board {
			font-size: 1.6rem;
			padding: 4px 16px;
		}

		.pause-btn {
			padding: 8px 16px;
			font-size: 1.2rem;
		}

		.restart-hint {
			font-size: 0.65rem;
			bottom: 12px;
			left: 12px;
		}
	}

	/* pause overlay message on canvas (optional but adds clarity) */
	.game-status-msg {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: #000000cc;
		backdrop-filter: blur(12px);
		padding: 12px 28px;
		border-radius: 60px;
		color: #ffec9f;
		font-size: 1.7rem;
		font-weight: bold;
		font-family: monospace;
		letter-spacing: 2px;
		border: 1px solid gold;
		pointer-events: none;
		z-index: 15;
		white-space: nowrap;
		transition: 0.1s ease;
	}

	@media (max-width: 500px) {
		.game-status-msg {
			font-size: 1.2rem;
			white-space: nowrap;
			padding: 8px 20px;
		}
	}
</style>`;
	document.body.innerHTML = `<div class="game-container">
	<canvas id="flappyCanvas" width="400" height="600"></canvas>
</div>
<div class="info-panel">
	<div class="score-board">SCORE: <span id="scoreValue">0</span></div>
</div>
<div class="pause-btn-container">
	<button class="pause-btn" id="pauseButton">⏸️ PAUSE</button>
</div>
<div class="restart-hint">
	🐦 Tap / Click | Space | ↑  —  R restart
</div>
<div id="statusMessage" class="game-status-msg" style="display: none;"></div>`;
	// ---------- CANVAS ----------
	const canvas = document.getElementById('flappyCanvas');
	const ctx = canvas.getContext('2d');

	// ---------- GAME DIMENSIONS (fixed logic size) ----------
	const CANVAS_W = 400;
	const CANVAS_H = 600;
	canvas.width = CANVAS_W;
	canvas.height = CANVAS_H;

	// ---------- GAME PARAMETERS ----------
	const GRAVITY = 0.2;
	const JUMP_POWER = -4.6;
	const PIPE_WIDTH = 52;
	const PIPE_GAP = 130;
	const PIPE_SPACING = 220;   // distance between pipe pairs
	const PIPE_SPEED = 2.2;

	// Bird settings
	const BIRD_RADIUS = 12;
	let bird = {
		x: CANVAS_W * 0.3,
		y: CANVAS_H / 2,
		velocity: 0,
		rotation: 0
	};

	let pipes = [];
	let score = 0;
	let gameRunning = true;      // true = game active, but may be paused
	let gamePaused = false;
	let animationId = null;

	// frame handling for smooth pause
	let lastTimestamp = 0;

	// Flag to avoid multiple restart loops
	let isGameOverFlag = false;

	// ---------- HELPER FUNCTIONS ----------
	function resetGame() {
		// reset bird
		bird.y = CANVAS_H / 2;
		bird.velocity = 0;
		bird.rotation = 0;
		score = 0;
		updateScoreUI();
		// reset pipes
		pipes = [];
		generateInitialPipes();
		gameRunning = true;
		gamePaused = false;
		isGameOverFlag = false;
		// hide any status overlay msg if visible
		const statusDiv = document.getElementById('statusMessage');
		statusDiv.style.display = 'none';
		// update pause button text to reflect unpaused state
		const pauseBtn = document.getElementById('pauseButton');
		pauseBtn.innerHTML = '⏸️ PAUSE';
		// restart animation loop (if needed ensure it's running)
		if (animationId === null) {
			startAnimation();
		}
	}

	function generateInitialPipes() {
		// generate first pipe at X = CANVAS_W + offset
		let startX = CANVAS_W + 80;
		for (let i = 0; i < 3; i++) {
			let pipeY = getRandomPipeY();
			pipes.push({
				x: startX + i * PIPE_SPACING,
				width: PIPE_WIDTH,
				topHeight: pipeY,
				bottomY: pipeY + PIPE_GAP,
				counted: false
			});
		}
	}

	function getRandomPipeY() {
		const minTop = 40;
		const maxTop = CANVAS_H - PIPE_GAP - 40;
		return Math.floor(Math.random() * (maxTop - minTop + 1) + minTop);
	}

	function addPipe() {
		let newPipeY = getRandomPipeY();
		pipes.push({
			x: CANVAS_W,
			width: PIPE_WIDTH,
			topHeight: newPipeY,
			bottomY: newPipeY + PIPE_GAP,
			counted: false
		});
	}

	function updatePipesAndScore() {
		// move pipes left & remove offscreen
		for (let i = 0; i < pipes.length; i++) {
			pipes[i].x -= PIPE_SPEED;
		}
		// remove offscreen pipes (x + width < 0)
		while (pipes.length > 0 && pipes[0].x + pipes[0].width < 0) {
			pipes.shift();
		}
		// add new pipes when needed (based on last pipe x)
		if (pipes.length === 0) {
			addPipe();
		} else {
			let lastPipe = pipes[pipes.length - 1];
			if (lastPipe.x + lastPipe.width <= CANVAS_W - PIPE_SPACING) {
				addPipe();
			}
		}

		// collision & score logic (only if game is active and not game over)
		if (!gameRunning || gamePaused) return;

		// Bird collision with pipes & boundaries
		const birdLeft = bird.x - BIRD_RADIUS;
		const birdRight = bird.x + BIRD_RADIUS;
		const birdTop = bird.y - BIRD_RADIUS;
		const birdBottom = bird.y + BIRD_RADIUS;

		// ceiling & floor collision
		if (bird.y - BIRD_RADIUS <= 0 || bird.y + BIRD_RADIUS >= CANVAS_H) {
			gameOver();
			return;
		}

		for (let pipe of pipes) {
			const pipeLeft = pipe.x;
			const pipeRight = pipe.x + pipe.width;
			const topPipeBottom = pipe.topHeight;
			const bottomPipeTop = pipe.bottomY;

			// check horizontal overlap
			if (birdRight > pipeLeft && birdLeft < pipeRight) {
				// check vertical collision with top pipe or bottom pipe
				if (birdTop < topPipeBottom || birdBottom > bottomPipeTop) {
					gameOver();
					return;
				}
			}

			// SCORE: when bird passes the pipe (right side of pipe without counting again)
			if (!pipe.counted && pipe.x + pipe.width < bird.x) {
				pipe.counted = true;
				score++;
				updateScoreUI();
			}
		}
	}

	function updateBirdPhysics() {
		if (!gameRunning || gamePaused) return;
		bird.velocity += GRAVITY;
		bird.y += bird.velocity;
		// apply rotation based on vertical velocity (smooth flappy style)
		bird.rotation = Math.min(Math.max(bird.velocity * 3, -25), 45);
	}

	function jump() {
		if (!gameRunning) return;    // game over, cannot jump
		if (gamePaused) return;      // no jump while paused
		bird.velocity = JUMP_POWER;
		// tiny angular impulse for fun
		bird.rotation = -20;
	}

	function gameOver() {
		if (!gameRunning) return;
		gameRunning = false;
		isGameOverFlag = true;
		// show game over message via overlay
		const statusDiv = document.getElementById('statusMessage');
		statusDiv.innerHTML = '💀 GAME OVER  |  PRESS R 💀';
		statusDiv.style.display = 'block';
		// Automatically hide after 2 sec? but keep visible until restart
		// update pause button to disabled style? we keep but pressing pause does nothing
	}

	function updateScoreUI() {
		document.getElementById('scoreValue').innerText = score;
	}

	// ---------- DRAW EVERYTHING (with pause visual style) ----------
	function drawBackground() {
		// sky gradient
		const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
		grad.addColorStop(0, "#6ed4ff");
		grad.addColorStop(0.7, "#48b5e0");
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
		// clouds
		ctx.fillStyle = "#ffffffcc";
		ctx.beginPath();
		ctx.ellipse(60, 80, 35, 30, 0, 0, Math.PI * 2);
		ctx.ellipse(100, 70, 40, 32, 0, 0, Math.PI * 2);
		ctx.ellipse(140, 85, 30, 28, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.ellipse(310, 130, 45, 35, 0, 0, Math.PI * 2);
		ctx.ellipse(350, 115, 35, 30, 0, 0, Math.PI * 2);
		ctx.ellipse(280, 120, 30, 28, 0, 0, Math.PI * 2);
		ctx.fill();
		// ground decoration
		ctx.fillStyle = "#8b5a2b";
		ctx.fillRect(0, CANVAS_H - 20, CANVAS_W, 20);
		ctx.fillStyle = "#c98a3e";
		for (let i = 0; i < 12; i++) {
			ctx.fillRect(i * 45, CANVAS_H - 24, 18, 8);
		}
	}

	function drawPipes() {
		for (let pipe of pipes) {
			// top pipe
			ctx.fillStyle = "#2f6b2f";
			ctx.shadowBlur = 0;
			ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
			ctx.fillStyle = "#1f4f1f";
			ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, pipe.width + 10, 32);
			ctx.fillStyle = "#3e9e3e";
			ctx.fillRect(pipe.x, pipe.topHeight - 25, pipe.width, 28);
			// bottom pipe
			const bottomPipeStartY = pipe.bottomY;
			const bottomPipeHeight = CANVAS_H - bottomPipeStartY;
			ctx.fillStyle = "#2f6b2f";
			ctx.fillRect(pipe.x, bottomPipeStartY, pipe.width, bottomPipeHeight);
			ctx.fillStyle = "#1f4f1f";
			ctx.fillRect(pipe.x - 5, bottomPipeStartY, pipe.width + 10, 32);
			ctx.fillStyle = "#3e9e3e";
			ctx.fillRect(pipe.x, bottomPipeStartY + 4, pipe.width, 28);
		}
		ctx.shadowBlur = 0;
	}

	function drawBird() {
		ctx.save();
		ctx.translate(bird.x, bird.y);
		let rotRad = bird.rotation * Math.PI / 180;
		ctx.rotate(rotRad);
		// body
		ctx.shadowBlur = 4;
		ctx.shadowColor = "rgba(0,0,0,0.3)";
		ctx.beginPath();
		ctx.ellipse(0, 0, BIRD_RADIUS, BIRD_RADIUS * 0.9, 0, 0, Math.PI * 2);
		ctx.fillStyle = "#FFD966";
		ctx.fill();
		ctx.beginPath();
		ctx.ellipse(3, -3, 4, 5, 0, 0, Math.PI * 2);
		ctx.fillStyle = "#000000";
		ctx.fill();
		ctx.fillStyle = "#FFFFFF";
		ctx.beginPath();
		ctx.arc(4, -4, 1.5, 0, Math.PI * 2);
		ctx.fill();
		// beak
		ctx.beginPath();
		ctx.moveTo(10, -2);
		ctx.lineTo(16, -1);
		ctx.lineTo(10, 2);
		ctx.fillStyle = "#E67E22";
		ctx.fill();
		// wing
		ctx.beginPath();
		ctx.moveTo(-6, 2);
		ctx.quadraticCurveTo(-2, 8, 5, 5);
		ctx.fillStyle = "#F39C12";
		ctx.fill();
		ctx.restore();
	}

	function drawScoreOnCanvas() {
		ctx.font = "bold 32px 'Courier New', monospace";
		ctx.fillStyle = "white";
		ctx.shadowBlur = 0;
		ctx.shadowColor = "black";
		ctx.fillText(score, CANVAS_W / 2 - 15, 60);
		ctx.fillStyle = "#ffd966";
		ctx.fillText(score, CANVAS_W / 2 - 17, 58);
	}

	function drawPausedOverlay() {
		if (gamePaused && gameRunning) {
			ctx.globalAlpha = 0.7;
			ctx.fillStyle = "#0a1a2f";
			ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
			ctx.globalAlpha = 1;
			ctx.font = "bold 28px monospace";
			ctx.fillStyle = "#FFE484";
			ctx.shadowBlur = 0;
			ctx.fillText("⏸ PAUSED", CANVAS_W / 2 - 75, CANVAS_H / 2 - 20);
			ctx.font = "16px monospace";
			ctx.fillStyle = "#cccccc";
			ctx.fillText("Tap / Space to resume", CANVAS_W / 2 - 95, CANVAS_H / 2 + 30);
		} else if (!gameRunning && isGameOverFlag) {
			// show game over text on canvas as extra
			ctx.globalAlpha = 0.85;
			ctx.fillStyle = "#1f2a2e";
			ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
			ctx.globalAlpha = 1;
			ctx.font = "bold 26px monospace";
			ctx.fillStyle = "#f3b33d";
			ctx.fillText("GAME OVER", CANVAS_W / 2 - 80, CANVAS_H / 2 - 30);
			ctx.font = "14px monospace";
			ctx.fillStyle = "#efefef";
			ctx.fillText("Press 'R' to restart", CANVAS_W / 2 - 65, CANVAS_H / 2 + 20);
		}
	}

	function renderFrame() {
		// clear canvas
		drawBackground();
		drawPipes();
		drawBird();
		if (!gamePaused && gameRunning) drawScoreOnCanvas();
		else if (gameRunning && gamePaused) drawScoreOnCanvas(); // show score even paused? add just small
		// draw pause/gameover overlays on top
		drawPausedOverlay();
	}

	// ---------- GAME LOOP ----------
	function gameUpdate() {
		if (gameRunning && !gamePaused) {
			updateBirdPhysics();
			updatePipesAndScore();
		}
		renderFrame();
	}

	let lastFrameTime = 0;
	function animate(timestamp) {
		animationId = requestAnimationFrame(animate);
		gameUpdate();
	}

	function startAnimation() {
		if (animationId !== null) return;
		animationId = requestAnimationFrame(animate);
	}

	// ---------- PAUSE TOGGLE ----------
	function togglePause() {
		if (!gameRunning) {
			// if game is over, we don't pause, but maybe restart via R key only
			return;
		}
		gamePaused = !gamePaused;
		const pauseBtn = document.getElementById('pauseButton');
		const statusMsgDiv = document.getElementById('statusMessage');
		if (gamePaused) {
			pauseBtn.innerHTML = '▶️ RESUME';
			// show a floating message also disappear after tap? but rely on canvas overlay
			if (statusMsgDiv.style.display === 'block' && statusMsgDiv.innerHTML.includes('GAME OVER')) { }
			else {
				// optional transient message (but not needed)
			}
		} else {
			pauseBtn.innerHTML = '⏸️ PAUSE';
			// hide any accidental message not game over related
			if (!isGameOverFlag) statusMsgDiv.style.display = 'none';
		}
	}

	// ---------- EVENT HANDLERS (Keyboard, Tap/Click) ----------
	function handleJumpOrStart(e) {
		// For touch/click on canvas (or key press) - jump if game running and not paused and not game over
		if (!gameRunning && isGameOverFlag) {
			// restart on tap when game over? but we have R key, but for better UX we can allow restart also via tap but we'll keep consistent? We'll let 'R' restart. But 
			return;
		}
		if (gameRunning && !gamePaused) {
			jump();
			e.preventDefault();
		} else if (gameRunning && gamePaused) {
			// if paused, tapping canvas / space also resumes (convenience)
			if (gamePaused) {
				togglePause();
				e.preventDefault();
			}
		}
	}

	function handleRestart(e) {
		if (e.key === 'r' || e.key === 'R') {
			e.preventDefault();
			resetGame();
		}
	}

	function globalKeyDown(e) {
		const key = e.key;
		if (key === ' ' || key === 'ArrowUp' || key === 'Space' || key === 'ArrowUp') {
			e.preventDefault();
			if (!gameRunning && isGameOverFlag) {
				resetGame();
			} else {
				if (gameRunning && gamePaused) {
					togglePause();
				} else if (gameRunning && !gamePaused) {
					jump();
				}
			}
		}
		if (key === 'r' || key === 'R') {
			e.preventDefault();
			resetGame();
		}
		if (key === 'Escape') {
			if (gameRunning && !isGameOverFlag) {
				togglePause();
				e.preventDefault();
			}
		}
	}

	// Touch / mouse click on canvas (jump or resume)
	function canvasClickHandler(e) {
		e.preventDefault();
		if (!gameRunning && isGameOverFlag) {
			resetGame();
			return;
		}
		if (gameRunning && gamePaused) {
			togglePause();
		} else if (gameRunning && !gamePaused) {
			jump();
		}
	}

	// Pause button explicit handler
	function pauseButtonHandler(e) {
		e.stopPropagation();
		if (!gameRunning && isGameOverFlag) {
			// if game over, pressing pause does nothing but we can reset? no, separate.
			return;
		}
		togglePause();
	}

	// ---------- INITIAL SETUP ----------
	function init() {
		resetGame();   // initial pipes, bird etc
		startAnimation();
		// Event listeners
		window.addEventListener('keydown', globalKeyDown);
		canvas.addEventListener('click', canvasClickHandler);
		canvas.addEventListener('touchstart', (e) => {
			e.preventDefault();
			canvasClickHandler(e);
		}, { passive: false });
		const pauseBtn = document.getElementById('pauseButton');
		pauseBtn.addEventListener('click', pauseButtonHandler);
		// ensure mobile tap on canvas does not cause double zoom etc
		canvas.addEventListener('contextmenu', (e) => e.preventDefault());
	}

	// extra: ensure game container resizes gracefully, canvas crisp
	window.addEventListener('resize', () => { });
	init();
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
});