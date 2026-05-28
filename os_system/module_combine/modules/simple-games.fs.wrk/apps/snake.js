// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: NONE
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowTitleSet("Snake");
	// DOM Translation
	document.head.innerHTML = `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
<style>
	* {
		box-sizing: border-box;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	body {
		background: radial-gradient(circle at 20% 30%, #1a472a, #0a1f0e);
		min-height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		font-family: 'Segoe UI', 'Courier New', 'Press Start 2P', monospace;
		margin: 0;
		padding: 16px;
	}

	/* main game card */
	.game-container {
		background: #0d2b1a;
		border-radius: 48px;
		padding: 20px 16px 24px 16px;
		box-shadow: 0 20px 35px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.1);
		transition: all 0.2s;
	}

	/* responsive canvas wrapper */
	.canvas-wrapper {
		display: flex;
		justify-content: center;
		margin: 0 auto;
	}

	canvas {
		background-color: #1e3a2f;
		border-radius: 24px;
		display: block;
		box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5), inset 0 0 0 2px #5f9e6e;
		width: min(70vw, 70vh, 540px);
		height: min(70vw, 70vh, 540px);
		cursor: pointer;
	}

	/* info panel */
	.info-panel {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin: 18px 12px 10px 12px;
		gap: 18px;
		flex-wrap: wrap;
	}

	.score-box {
		background: #010d06;
		padding: 8px 20px;
		border-radius: 60px;
		box-shadow: inset 0 2px 5px #00000033, 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.score-label {
		font-size: 0.9rem;
		letter-spacing: 2px;
		color: #b1e6c7;
		font-weight: bold;
		text-transform: uppercase;
	}

	.score-value {
		font-size: 2rem;
		font-weight: 800;
		color: #f9f3b0;
		line-height: 1;
		text-shadow: 0 2px 0 #2f5e3a;
		font-family: monospace;
	}

	.status {
		background: #00000066;
		backdrop-filter: blur(4px);
		padding: 6px 20px;
		border-radius: 60px;
		font-weight: bold;
		font-size: 1rem;
		color: #f3ffcf;
	}

	/* button panel (touch + desktop) */
	.controls {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 14px;
		margin: 20px 8px 8px 8px;
	}

	button {
		background: #2b4b35;
		border: none;
		font-family: inherit;
		font-weight: bold;
		font-size: 1.25rem;
		padding: 10px 18px;
		min-width: 70px;
		border-radius: 60px;
		color: #efffdf;
		box-shadow: 0 5px 0 #0a2b18;
		cursor: pointer;
		transition: 0.07s linear;
		letter-spacing: 1px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	button:active {
		transform: translateY(3px);
		box-shadow: 0 2px 0 #0a2b18;
	}

	.dir-buttons {
		display: flex;
		gap: 12px;
		background: #1c3626b3;
		padding: 8px 16px;
		border-radius: 80px;
		backdrop-filter: blur(2px);
	}

	.dir-btn {
		background: #1f4230;
		font-size: 1.6rem;
		padding: 6px 18px;
		min-width: 70px;
		font-weight: bold;
	}

	.action-btn {
		background: #5e3a2c;
		box-shadow: 0 5px 0 #3a231a;
	}

	.restart-btn {
		background: #2f6b47;
		box-shadow: 0 5px 0 #1a442e;
	}

	.pause-btn {
		background: #6e5c2c;
		box-shadow: 0 5px 0 #4a3b1c;
	}

	@media (max-width: 550px) {
		.game-container {
			padding: 12px 12px 20px;
		}

		button {
			padding: 6px 12px;
			font-size: 1rem;
			min-width: 58px;
		}

		.dir-btn {
			font-size: 1.3rem;
			padding: 5px 14px;
			min-width: 58px;
		}

		.score-value {
			font-size: 1.6rem;
		}

		.status {
			font-size: 0.75rem;
			padding: 4px 16px;
		}
	}

	@media (max-width: 420px) {
		.dir-buttons {
			gap: 6px;
		}

		.dir-btn {
			min-width: 52px;
			padding: 5px 8px;
		}
	}

	footer {
		font-size: 0.65rem;
		text-align: center;
		color: #779b83;
		margin-top: 12px;
		letter-spacing: 1px;
	}
</style>`;
	document.body.innerHTML = `<div>
	<div class="game-container">
		<div class="canvas-wrapper">
			<canvas id="snakeCanvas" width="500" height="500"></canvas>
		</div>

		<div class="info-panel">
			<div class="score-box">
				<div class="score-label">🍎 SCORE</div>
				<div class="score-value" id="scoreDisplay">0</div>
			</div>
			<div class="status" id="statusText">▶ GAME ACTIVE</div>
		</div>

		<div class="controls">
			<div class="dir-buttons">
				<button class="dir-btn" data-dir="UP">▲</button>
				<button class="dir-btn" data-dir="LEFT">◀</button>
				<button class="dir-btn" data-dir="DOWN">▼</button>
				<button class="dir-btn" data-dir="RIGHT">▶</button>
			</div>
			<button class="action-btn pause-btn" id="pauseButton">⏸️ PAUSE</button>
			<button class="action-btn restart-btn" id="restartButton">⟳ RESTART</button>
		</div>
		<footer>←  →  ↑  ↓  •  [P] pause  •  [R] restart</footer>
	</div>
</div>`;
	// ---------- CONFIGURATION ----------
	const BOARD_SIZE = 20;       // 20x20 grid
	const CELL_SIZE = 500 / BOARD_SIZE; // 25px logical, canvas is 500x500
	const BASE_SPEED_MS = 150;   // milliseconds per tick

	// DOM elements
	const canvas = document.getElementById('snakeCanvas');
	const ctx = canvas.getContext('2d');
	const scoreSpan = document.getElementById('scoreDisplay');
	const statusDiv = document.getElementById('statusText');

	// Game state variables
	let snake = [];          // array of [x,y] positions
	let food = { x: 12, y: 12 };
	let direction = 'RIGHT';      // current moving direction
	let nextDirection = 'RIGHT';
	let score = 0;
	let gameActive = true;    // false if game over (lose/win)
	let paused = false;
	let gameInterval = null;
	let winFlag = false;       // to differentiate win/loss message

	// Helper: check if two positions match
	function isPosEqual(p1, p2) {
		return p1[0] === p2[0] && p1[1] === p2[1];
	}

	// Get random integer in range
	function randomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	// Check if a given (x,y) is inside the snake body
	function isOnSnake(x, y, ignoreHead = false) {
		for (let i = (ignoreHead ? 1 : 0); i < snake.length; i++) {
			if (snake[i][0] === x && snake[i][1] === y) return true;
		}
		return false;
	}

	// Get all free cells (empty positions not occupied by snake)
	function getFreeCells() {
		const free = [];
		for (let i = 0; i < BOARD_SIZE; i++) {
			for (let j = 0; j < BOARD_SIZE; j++) {
				if (!isOnSnake(i, j, false)) {
					free.push([i, j]);
				}
			}
		}
		return free;
	}

	// Generate new food at random empty cell, returns true if success, false if no free cells (win)
	function generateRandomFood() {
		const freeCells = getFreeCells();
		if (freeCells.length === 0) {
			return false;   // board full -> win condition
		}
		const randomIndex = Math.floor(Math.random() * freeCells.length);
		const [fx, fy] = freeCells[randomIndex];
		food = { x: fx, y: fy };
		return true;
	}

	// Reset game fully (start new game)
	function resetGame() {
		// stop ongoing interval
		if (gameInterval) {
			clearInterval(gameInterval);
			gameInterval = null;
		}

		// initial snake: length 3 horizontal in the middle
		const mid = Math.floor(BOARD_SIZE / 2);
		snake = [
			[mid, mid],     // head
			[mid - 1, mid],
			[mid - 2, mid]
		];
		direction = 'RIGHT';
		nextDirection = 'RIGHT';
		score = 0;
		gameActive = true;
		paused = false;
		winFlag = false;
		updateScoreUI();
		statusDiv.innerText = '▶ GAME ACTIVE';
		statusDiv.style.color = '#f3ffcf';

		// generate first food avoiding snake
		if (!generateRandomFood()) {
			// edge case: but new board has free space, so safe fallback
			food = { x: 5, y: 5 };
			while (isOnSnake(food.x, food.y)) {
				food = { x: randomInt(0, BOARD_SIZE - 1), y: randomInt(0, BOARD_SIZE - 1) };
			}
		}

		drawGame();    // immediate fresh draw
		startGameLoop();  // start ticker
	}

	// Start/resume interval (only if gameActive and not paused)
	function startGameLoop() {
		if (gameInterval) clearInterval(gameInterval);
		if (gameActive && !paused) {
			gameInterval = setInterval(gameTick, BASE_SPEED_MS);
		} else {
			gameInterval = null;
		}
	}

	// stop interval (used during pause or game over)
	function stopGameLoop() {
		if (gameInterval) {
			clearInterval(gameInterval);
			gameInterval = null;
		}
	}

	// Toggle pause state (only if game is active, not game over)
	function togglePause() {
		if (!gameActive) return;   // cannot pause when game over

		paused = !paused;
		if (paused) {
			// pause the game
			stopGameLoop();
			statusDiv.innerText = '⏸ PAUSED';
			statusDiv.style.color = '#eacd8a';
			drawGame();  // redraw with pause overlay
		} else {
			// resume
			statusDiv.innerText = '▶ GAME ACTIVE';
			statusDiv.style.color = '#f3ffcf';
			startGameLoop();
			drawGame();  // remove overlay text
		}
	}

	// Update score display
	function updateScoreUI() {
		scoreSpan.innerText = score;
	}

	// Handle game over (loss or win)
	function endGame(isWin = false) {
		if (!gameActive) return;
		gameActive = false;
		winFlag = isWin;
		stopGameLoop();
		if (isWin) {
			statusDiv.innerText = '🏆 YOU WIN! 🏆';
			statusDiv.style.color = '#ffd966';
		} else {
			statusDiv.innerText = '💀 GAME OVER 💀';
			statusDiv.style.color = '#f5ac78';
		}
		drawGame(); // draw final frame with game over message
	}

	// Core movement logic
	function moveSnake() {
		if (!gameActive || paused) return false; // movement only when active & not paused

		// commit queued direction if not opposite
		const oppositeMap = {
			'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT'
		};
		if (nextDirection && oppositeMap[nextDirection] !== direction) {
			direction = nextDirection;
		}

		// compute new head
		let newHead = [...snake[0]];
		switch (direction) {
			case 'UP': newHead[1]--; break;
			case 'DOWN': newHead[1]++; break;
			case 'LEFT': newHead[0]--; break;
			case 'RIGHT': newHead[0]++; break;
			default: break;
		}

		const headX = newHead[0];
		const headY = newHead[1];
		const willEat = (headX === food.x && headY === food.y);

		// Build new snake array
		let newSnake = [newHead, ...snake];
		if (!willEat) {
			newSnake.pop();   // remove tail if not eating
		}

		// ---- Collision detection ----
		// Wall collision
		if (headX < 0 || headX >= BOARD_SIZE || headY < 0 || headY >= BOARD_SIZE) {
			endGame(false);
			drawGame();
			return false;
		}

		// Self collision: check if the head position appears more than once in newSnake
		const headPos = newSnake[0];
		let selfCollision = false;
		for (let i = 1; i < newSnake.length; i++) {
			if (newSnake[i][0] === headPos[0] && newSnake[i][1] === headPos[1]) {
				selfCollision = true;
				break;
			}
		}
		if (selfCollision) {
			endGame(false);
			drawGame();
			return false;
		}

		// Apply new snake
		snake = newSnake;

		// Handle food consumption
		if (willEat) {
			score++;
			updateScoreUI();
			const success = generateRandomFood();
			if (!success) {
				// board is completely full → WIN!
				endGame(true);
				drawGame();
				return false;
			}
		}

		drawGame();
		return true;
	}

	// Game tick (called by interval)
	function gameTick() {
		if (!gameActive || paused) return;
		moveSnake();
		// additional check if game became inactive due to moveSnake endGame
		if (!gameActive) {
			stopGameLoop();
		}
	}

	// ---------- DIRECTION CONTROL (keyboard + buttons) ----------
	function setDirection(newDir) {
		if (!gameActive || paused) return;   // no direction changes while paused or game over
		const opposite = {
			'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT'
		};
		// prevent 180° flip
		if (opposite[newDir] !== direction) {
			nextDirection = newDir;
		}
	}

	// ---------- DRAW EVERYTHING (canvas with pause/gameover overlays) ----------
	function drawGame() {
		if (!ctx) return;
		ctx.clearRect(0, 0, 500, 500);

		// draw background grid (soft lines)
		ctx.strokeStyle = '#2b6e4e';
		ctx.lineWidth = 0.6;
		for (let i = 0; i <= BOARD_SIZE; i++) {
			ctx.beginPath();
			ctx.moveTo(i * CELL_SIZE, 0);
			ctx.lineTo(i * CELL_SIZE, 500);
			ctx.stroke();
			ctx.moveTo(0, i * CELL_SIZE);
			ctx.lineTo(500, i * CELL_SIZE);
			ctx.stroke();
		}

		// draw food (red apple style)
		ctx.shadowBlur = 0;
		ctx.fillStyle = '#ea5a47';
		ctx.beginPath();
		const fx = food.x * CELL_SIZE, fy = food.y * CELL_SIZE;
		ctx.arc(fx + CELL_SIZE / 2, fy + CELL_SIZE / 2, CELL_SIZE * 0.38, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#fff0b0';
		ctx.beginPath();
		ctx.arc(fx + CELL_SIZE * 0.65, fy + CELL_SIZE * 0.35, CELL_SIZE * 0.1, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#5a2e1a';
		ctx.beginPath();
		ctx.moveTo(fx + CELL_SIZE * 0.75, fy + CELL_SIZE * 0.2);
		ctx.lineTo(fx + CELL_SIZE * 0.9, fy + CELL_SIZE * 0.05);
		ctx.lineTo(fx + CELL_SIZE * 0.85, fy + CELL_SIZE * 0.25);
		ctx.fill();

		// draw snake (gradient green)
		for (let i = 0; i < snake.length; i++) {
			const [x, y] = snake[i];
			const posX = x * CELL_SIZE;
			const posY = y * CELL_SIZE;
			const gradient = ctx.createLinearGradient(posX, posY, posX + CELL_SIZE, posY + CELL_SIZE);
			if (i === 0) {
				gradient.addColorStop(0, '#6cc24a');
				gradient.addColorStop(1, '#3b8f2c');
			} else {
				gradient.addColorStop(0, '#4b9e3a');
				gradient.addColorStop(1, '#2b7340');
			}
			ctx.fillStyle = gradient;
			ctx.fillRect(posX + 1, posY + 1, CELL_SIZE - 2, CELL_SIZE - 2);
			ctx.fillStyle = '#cdf2b0';
			if (i === 0) {
				ctx.beginPath();
				ctx.arc(posX + CELL_SIZE * 0.7, posY + CELL_SIZE * 0.35, CELL_SIZE * 0.12, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = '#1f2e1c';
				ctx.beginPath();
				ctx.arc(posX + CELL_SIZE * 0.7, posY + CELL_SIZE * 0.33, CELL_SIZE * 0.06, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		// ---- Overlay messages (pause / game over) ----
		if (!gameActive) {
			ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
			ctx.fillRect(0, 0, 500, 500);
			ctx.font = `bold ${Math.floor(CELL_SIZE * 1.4)}px "Courier New", monospace`;
			ctx.fillStyle = winFlag ? '#fed54e' : '#ffaa77';
			ctx.shadowBlur = 0;
			ctx.textAlign = "center";
			const message = winFlag ? "✨ YOU WIN! ✨" : "☠️ GAME OVER ☠️";
			ctx.fillText(message, 250, 250);
			ctx.font = `18px monospace`;
			ctx.fillStyle = '#c7e9c0';
			ctx.fillText("press RESTART", 250, 340);
			ctx.textAlign = "left";
		}
		else if (paused) {
			ctx.fillStyle = 'rgba(10, 20, 8, 0.75)';
			ctx.fillRect(0, 0, 500, 500);
			ctx.font = `bold ${Math.floor(CELL_SIZE * 1.5)}px "Courier New", monospace`;
			ctx.fillStyle = '#f5e5a0';
			ctx.textAlign = "center";
			ctx.fillText("⏸ PAUSED", 250, 260);
			ctx.font = `14px monospace`;
			ctx.fillStyle = '#adf0b2';
			ctx.fillText("press PAUSE or [P] to resume", 250, 340);
			ctx.textAlign = "left";
		}

		// draw neat border
		ctx.strokeStyle = '#adffa3';
		ctx.lineWidth = 2.5;
		ctx.strokeRect(2, 2, 496, 496);
	}

	// ---------- EVENT HANDLERS ----------
	function handleKeyDown(e) {
		const key = e.key;
		// prevent arrow keys from scrolling
		if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' ||
			key === ' ' || key === 'Space' || key === 'p' || key === 'P' || key === 'r' || key === 'R') {
			e.preventDefault();
		}

		// direction controls (only if game active and not paused)
		if (gameActive && !paused) {
			switch (key) {
				case 'ArrowUp': setDirection('UP'); break;
				case 'ArrowDown': setDirection('DOWN'); break;
				case 'ArrowLeft': setDirection('LEFT'); break;
				case 'ArrowRight': setDirection('RIGHT'); break;
				default: break;
			}
		}

		// Pause toggle: key P or p (works also when game active)
		if (key === 'p' || key === 'P') {
			if (gameActive) {
				togglePause();
			}
		}

		// Restart: R key always works, even during game over or paused
		if (key === 'r' || key === 'R') {
			resetGame();
		}
	}

	// Buttons control
	function bindButtons() {
		// direction buttons
		document.querySelectorAll('[data-dir]').forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				const dir = btn.getAttribute('data-dir');
				if (gameActive && !paused) {
					setDirection(dir);
				}
			});
			// touch device friendly
			btn.addEventListener('touchstart', (e) => {
				e.preventDefault();
				const dir = btn.getAttribute('data-dir');
				if (gameActive && !paused) setDirection(dir);
			});
		});

		const pauseBtn = document.getElementById('pauseButton');
		pauseBtn.addEventListener('click', (e) => {
			e.preventDefault();
			if (gameActive) togglePause();
		});
		pauseBtn.addEventListener('touchstart', (e) => {
			e.preventDefault();
			if (gameActive) togglePause();
		});

		const restartBtn = document.getElementById('restartButton');
		restartBtn.addEventListener('click', (e) => {
			e.preventDefault();
			resetGame();
		});
		restartBtn.addEventListener('touchstart', (e) => {
			e.preventDefault();
			resetGame();
		});
	}

	// ---------- INITIALIZE GAME ----------
	function init() {
		bindButtons();
		window.addEventListener('keydown', handleKeyDown);
		// initialize fresh game
		resetGame();
	}

	// start everything
	init();
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
});