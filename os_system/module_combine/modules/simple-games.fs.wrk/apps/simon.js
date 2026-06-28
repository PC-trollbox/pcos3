// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: NONE
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowTitleSet("Simon");
	// DOM Translation
	document.head.innerHTML = `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
<style>
	* {
		box-sizing: border-box;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	body {
		background: linear-gradient(145deg, #1a2a3a 0%, #0f1a24 100%);
		min-height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		font-family: 'Segoe UI', 'Poppins', system-ui, -apple-system, 'Roboto', sans-serif;
		margin: 0;
		padding: 16px;
	}

	/* main card container — fits perfectly on any screen */
	.simon-container {
		background: rgba(10, 20, 28, 0.65);
		backdrop-filter: blur(3px);
		border-radius: 64px;
		padding: 20px 16px 28px 16px;
		box-shadow: 0 20px 35px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	/* main game panel */
	.simon-game {
		max-width: 520px;
		width: 100%;
		margin: 0 auto;
		background: #0f1a1f;
		border-radius: 56px;
		padding: 20px 18px 24px 18px;
		box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.6), 0 12px 28px rgba(0, 0, 0, 0.5);
	}

	/* 2x2 button grid */
	.simon-pad {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 18px;
		margin-bottom: 28px;
	}

	.color-btn {
		aspect-ratio: 1 / 1;
		border-radius: 32px;
		border: none;
		cursor: pointer;
		transition: all 0.05s linear;
		box-shadow: 0 8px 0 rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.3);
		will-change: transform;
		touch-action: manipulation;
	}

	.color-btn:active {
		transform: scale(0.96);
		box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
	}

	/* active flash effect */
	.active-flash {
		filter: brightness(1.3) saturate(1.2);
		transform: scale(0.98);
		box-shadow: 0 0 14px rgba(255, 255, 200, 0.8);
	}

	/* specific colors */
	.green {
		background: radial-gradient(circle at 30% 35%, #2ecc71, #1f8a4c);
		border-bottom: 4px solid #0e5a32;
	}

	.red {
		background: radial-gradient(circle at 30% 35%, #e74c3c, #b33a2c);
		border-bottom: 4px solid #7e2a1f;
	}

	.yellow {
		background: radial-gradient(circle at 30% 35%, #f1c40f, #d4ac0d);
		border-bottom: 4px solid #9a7e0a;
	}

	.blue {
		background: radial-gradient(circle at 30% 35%, #3498db, #1f618d);
		border-bottom: 4px solid #124263;
	}

	/* info panel */
	.info-panel {
		background: #1e2f38;
		border-radius: 60px;
		padding: 14px 20px;
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 12px;
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5), 0 5px 8px rgba(0, 0, 0, 0.2);
	}

	.score-box {
		background: #0a1217;
		padding: 8px 18px;
		border-radius: 40px;
		color: #f3f9ff;
		font-weight: bold;
		font-size: 1.6rem;
		letter-spacing: 2px;
		font-family: monospace;
		box-shadow: inset 0 1px 3px #00000055, 0 2px 3px rgba(255, 255, 240, 0.1);
		min-width: 90px;
		text-align: center;
	}

	.score-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 2px;
		font-weight: 500;
		display: block;
		color: #89b9cf;
	}

	.status {
		background: #000000aa;
		backdrop-filter: blur(8px);
		padding: 8px 18px;
		border-radius: 40px;
		font-weight: bold;
		font-size: 1.2rem;
		color: #FFE7C4;
		text-shadow: 0 1px 2px black;
		letter-spacing: 1px;
	}

	.control-buttons {
		display: flex;
		gap: 12px;
	}

	button.action {
		background: #2c3e44;
		border: none;
		font-size: 1rem;
		font-weight: bold;
		padding: 8px 18px;
		border-radius: 40px;
		color: #f0f7fc;
		cursor: pointer;
		transition: 0.1s linear;
		box-shadow: 0 3px 0 #0f191f;
		font-family: inherit;
		touch-action: manipulation;
	}

	button.action:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 #0f191f;
	}

	.strict-led {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #1a2b30;
		padding: 4px 12px;
		border-radius: 50px;
	}

	.led {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #4a0000;
		box-shadow: inset 0 1px 2px black, 0 0 2px rgba(0, 0, 0, 0.5);
		transition: 0.07s linear;
	}

	.led.active-led {
		background: #ff3a2f;
		box-shadow: 0 0 8px #ff5e4a;
	}

	.strict-text {
		font-size: 0.7rem;
		font-weight: bold;
		color: #bdd4db;
	}

	/* responsive tweaks */
	@media (max-width: 480px) {
		.simon-game {
			padding: 16px 14px 20px;
		}

		.simon-pad {
			gap: 14px;
		}

		.color-btn {
			border-radius: 24px;
		}

		.score-box {
			font-size: 1.3rem;
			padding: 4px 14px;
		}

		.status {
			font-size: 0.9rem;
			padding: 5px 12px;
		}

		button.action {
			padding: 6px 14px;
			font-size: 0.85rem;
		}

		.info-panel {
			padding: 12px 14px;
		}
	}

	@media (max-width: 380px) {
		.simon-pad {
			gap: 10px;
		}

		.info-panel {
			flex-direction: column;
			align-items: center;
		}

		.control-buttons {
			width: 100%;
			justify-content: center;
		}
	}

	/* disable pointer events during cpu turn */
	.disable-interaction .color-btn {
		pointer-events: none;
		cursor: default;
	}

	/* general state */
	button:focus-visible {
		outline: 2px solid gold;
	}
</style>`;
	document.body.innerHTML = `<div class="simon-container">
	<div class="simon-game" id="simonGame">
		<div class="simon-pad" id="buttonPad">
			<button class="color-btn green" data-color="green" data-sound="green" aria-label="Green"></button>
			<button class="color-btn red" data-color="red" data-sound="red" aria-label="Red"></button>
			<button class="color-btn yellow" data-color="yellow" data-sound="yellow" aria-label="Yellow"></button>
			<button class="color-btn blue" data-color="blue" data-sound="blue" aria-label="Blue"></button>
		</div>

		<div class="info-panel">
			<div class="score-box">
				<span class="score-label">SCORE</span>
				<span id="scoreValue">0</span>
			</div>
			<div class="status" id="statusText">● START</div>
			<div class="control-buttons">
				<button class="action" id="startBtn">▶ START</button>
				<div class="strict-led">
					<div class="led" id="strictLed"></div>
					<span class="strict-text">STRICT</span>
					<button class="action" id="strictToggleBtn" style="padding: 4px 12px; background:#1e4a5c;">⚡</button>
				</div>
			</div>
		</div>
	</div>
</div>`;
	// ---------- GAME STATE ----------
	let sequence = [];        // array of colors (strings)
	let playerTurn = false;   // is it player's turn to input?
	let playerIndex = 0;      // next index to match in sequence
	let strictMode = false;
	let gameActive = false;    // if game is running (not game over, not idle)
	let allowInput = false;    // only true when playerTurn && !cpuPlaying && gameActive && not waiting for animation

	// UI elements
	const greenBtn = document.querySelector('[data-color="green"]');
	const redBtn = document.querySelector('[data-color="red"]');
	const yellowBtn = document.querySelector('[data-color="yellow"]');
	const blueBtn = document.querySelector('[data-color="blue"]');
	const allColorBtns = [greenBtn, redBtn, yellowBtn, blueBtn];
	const scoreSpan = document.getElementById('scoreValue');
	const statusDiv = document.getElementById('statusText');
	const startBtn = document.getElementById('startBtn');
	const strictToggleBtn = document.getElementById('strictToggleBtn');
	const strictLed = document.getElementById('strictLed');
	const gameContainer = document.getElementById('simonGame');

	// sound simulation (web audio)
	let audioCtx = null;
	const soundMap = {
		green: 523.25,   // C5
		red: 392.00,     // G4
		yellow: 440.00,  // A4
		blue: 329.63     // E4
	};

	// helper to play beep (safe for mobile, creates context on first user click)
	function playTone(freq, duration = 0.2) {
		// try to init audio context on demand, but only if user interacted (start game or click)
		if (!audioCtx) {
			try {
				audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			} catch (e) { return; }
		}
		// suspend/resume handling: context must be resumed after user gesture
		if (audioCtx.state === 'suspended') {
			audioCtx.resume().then(() => {
				playToneInternal(freq, duration);
			}).catch(e => console.log("audio resume fail"));
		} else {
			playToneInternal(freq, duration);
		}
	}

	function playToneInternal(freq, duration) {
		if (!audioCtx) return;
		const now = audioCtx.currentTime;
		const osc = audioCtx.createOscillator();
		const gain = audioCtx.createGain();
		osc.connect(gain);
		gain.connect(audioCtx.destination);
		osc.frequency.value = freq;
		gain.gain.setValueAtTime(0.2, now);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
		osc.start();
		osc.stop(now + duration);
	}

	// flash a button visually + play sound
	function animatePress(color, callback) {
		const btn = getButtonByColor(color);
		if (!btn) return;
		btn.classList.add('active-flash');
		const freq = soundMap[color];
		if (freq) playTone(freq, 0.2);
		setTimeout(() => {
			btn.classList.remove('active-flash');
			if (callback) callback();
		}, 180);
	}

	function getButtonByColor(color) {
		switch (color) {
			case 'green': return greenBtn;
			case 'red': return redBtn;
			case 'yellow': return yellowBtn;
			case 'blue': return blueBtn;
			default: return null;
		}
	}

	// update score display based on sequence length
	function updateScoreUI() {
		scoreSpan.innerText = sequence.length;
	}

	// set game status message
	function setStatus(msg, isError = false) {
		statusDiv.innerHTML = msg;
		if (isError) {
			setTimeout(() => {
				if (statusDiv.innerHTML === msg && gameActive) {
					if (playerTurn) statusDiv.innerHTML = "🎵 YOUR TURN";
					else if (!gameActive) { }
					else statusDiv.innerHTML = "⚡ SIMON'S TURN";
				}
			}, 1000);
		}
	}

	// Enable/disable clicks on game pad
	function setInteractive(enable) {
		allowInput = enable && gameActive && playerTurn;
		if (enable && playerTurn && gameActive) {
			gameContainer.classList.remove('disable-interaction');
		} else {
			gameContainer.classList.add('disable-interaction');
			if (!enable) gameContainer.classList.add('disable-interaction');
			else if (!playerTurn || !gameActive) gameContainer.classList.add('disable-interaction');
		}
		// re-evaluate class: if allowInput true -> remove class; else add
		if (allowInput) {
			gameContainer.classList.remove('disable-interaction');
		} else {
			gameContainer.classList.add('disable-interaction');
		}
	}

	// Show error and optionally reset or handle strict mode loss
	function handleMistake() {
		if (!gameActive) return;
		if (strictMode) {
			// strict: game over, reset everything
			setStatus("❌ STRICT FAIL — GAME OVER", true);
			gameOverReset();
		} else {
			// non-strict: replay current sequence
			setStatus("⚠️ WRONG! REPEATING...", true);
			// disable player input completely
			playerTurn = false;
			setInteractive(false);
			// replay same sequence after short delay
			setTimeout(() => {
				if (gameActive) {
					playSequence();
				}
			}, 900);
		}
	}

	// full game reset (keep strict mode preference)
	function gameOverReset() {
		gameActive = false;
		playerTurn = false;
		allowInput = false;
		sequence = [];
		playerIndex = 0;
		updateScoreUI();
		setInteractive(false);
		setStatus("💀 GAME OVER · PRESS START");
		// remove any pending timers (by flag control)
	}

	// normal reset but keep game active: start fresh round
	function resetAndStart() {
		// stop any ongoing animations
		gameActive = false; // disable current actions
		playerTurn = false;
		allowInput = false;
		setInteractive(false);
		sequence = [];
		playerIndex = 0;
		updateScoreUI();
		// restart new game fresh
		startGameLogic();
	}

	// begin new game session
	function startGameLogic() {
		if (!audioCtx) {
			// init audio on start click, good for mobile
			try {
				audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			} catch (e) { }
		}
		// resume audio if suspended
		if (audioCtx && audioCtx.state === 'suspended') {
			audioCtx.resume();
		}
		gameActive = true;
		sequence = [];
		playerIndex = 0;
		updateScoreUI();
		// add first random color to sequence
		addRandomStep();
		// start showing sequence
		playSequence();
	}

	// add one random color to sequence
	function addRandomStep() {
		const colors = ['green', 'red', 'yellow', 'blue'];
		const randomColor = colors[Math.floor(Math.random() * colors.length)];
		sequence.push(randomColor);
		updateScoreUI();
	}

	// plays the entire sequence with delays
	function playSequence() {
		if (!gameActive) return;
		playerTurn = false;
		setInteractive(false);
		setStatus("🎹 SIMON'S TURN");
		let idx = 0;
		function playNext() {
			if (!gameActive) return;
			if (idx >= sequence.length) {
				// finished showing sequence -> enable player turn
				playerTurn = true;
				playerIndex = 0;
				setInteractive(true);
				setStatus("🎵 YOUR TURN");
				return;
			}
			const color = sequence[idx];
			animatePress(color, () => {
				idx++;
				setTimeout(playNext, 280);
			});
		}
		playNext();
	}

	// called when player successfully matches a full round
	function playerRoundComplete() {
		if (!gameActive) return;
		// check if player finished whole sequence
		if (playerIndex === sequence.length) {
			// round complete: add next step
			addRandomStep();
			// after a short pause, show the new extended sequence
			playerTurn = false;
			setInteractive(false);
			setStatus("✅ GOOD! NEXT ROUND");
			setTimeout(() => {
				if (gameActive) {
					playSequence();
				}
			}, 700);
		} else {
			// still more to press, keep interactive but stay playerTurn true
			setInteractive(true);
		}
	}

	// player pressed a color button
	function onPlayerPress(color) {
		if (!gameActive) return;
		if (!playerTurn || !allowInput) return;

		// play press feedback
		animatePress(color, null);

		const expectedColor = sequence[playerIndex];
		if (color === expectedColor) {
			// correct press
			playerIndex++;
			// check win condition
			if (playerIndex === sequence.length) {
				// won the round
				playerTurn = false;
				setInteractive(false);
				setStatus("🌟 ROUND COMPLETE!");
				// check for max win? we just continue after timeout
				setTimeout(() => {
					if (gameActive) {
						playerRoundComplete();
					}
				}, 400);
			} else {
				// just correct, continue, keep player turn active
				setInteractive(true);
			}
		} else {
			// wrong press
			handleMistake();
		}
	}

	// Strict mode toggle
	function toggleStrictMode() {
		if (!gameActive) {
			strictMode = !strictMode;
			updateStrictLed();
			setStatus(strictMode ? "⚡ STRICT MODE ON" : "🔵 STRICT MODE OFF");
		} else {
			// if game is active, we can still toggle but we show warning / but toggle allowed? classic simon can change anytime
			strictMode = !strictMode;
			updateStrictLed();
			setStatus(strictMode ? "⚠️ STRICT ENABLED" : "🔵 STRICT DISABLED", false);
			setTimeout(() => {
				if (gameActive && !playerTurn) setStatus("🎹 SIMON'S TURN");
				else if (gameActive && playerTurn) setStatus("🎵 YOUR TURN");
			}, 1000);
		}
	}

	function updateStrictLed() {
		if (strictMode) {
			strictLed.classList.add('active-led');
		} else {
			strictLed.classList.remove('active-led');
		}
	}

	// START handler (reset + start)
	function onStart() {
		// kill any ongoing game loops, fully reset
		if (audioCtx && audioCtx.state === 'suspended') {
			audioCtx.resume();
		}
		gameActive = false; // halt current async flows
		playerTurn = false;
		allowInput = false;
		setInteractive(false);
		sequence = [];
		playerIndex = 0;
		updateScoreUI();
		// restart fresh
		startGameLogic();
	}

	// attach click listeners to color buttons
	function bindEvents() {
		greenBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			onPlayerPress('green');
		});
		redBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			onPlayerPress('red');
		});
		yellowBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			onPlayerPress('yellow');
		});
		blueBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			onPlayerPress('blue');
		});

		startBtn.addEventListener('click', () => {
			onStart();
		});
		strictToggleBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			toggleStrictMode();
		});
	}

	// ensure touch & mouse friendly, prevent double tap zoom on buttons
	function setupMobileFriendly() {
		allColorBtns.forEach(btn => {
			btn.addEventListener('touchstart', (e) => {
				// prevent ghost clicks, but keep functionality
				e.preventDefault();
				btn.click();
			}, { passive: false });
		});
	}

	// initial UI state
	function initUI() {
		updateScoreUI();
		setStatus("⚡ PRESS START");
		gameActive = false;
		playerTurn = false;
		setInteractive(false);
		updateStrictLed();
		strictMode = false;
		gameContainer.classList.add('disable-interaction');
	}

	initUI();
	bindEvents();
	setupMobileFriendly();
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
});