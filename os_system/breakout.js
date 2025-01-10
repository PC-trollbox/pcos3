// =====BEGIN MANIFEST=====
// allow: GRAB_ATTENTION
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	// Gamedev-Canvas-workshop by Andrzej Mazur and Mozilla Contributors (https://developer.mozilla.org/en-US/docs/MDN/About#Copyrights_and_licenses) is licensed under CC-BY-SA 2.5 (http://creativecommons.org/licenses/by-sa/2.5/).
	// Any copyright to code samples and snippets is dedicated to the Public Domain (http://creativecommons.org/publicdomain/zero/1.0/).
	// Adapted to PCOS v3 by PC
	await availableAPIs.windowTitleSet("Breakout");
	await availableAPIs.windowResize([480, 357]);
	document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
	document.body.style.background = "white";
	let startButton = document.createElement("button");
	startButton.innerText = "Start";
	let canvas = document.createElement("canvas");
	canvas.width = 480;
	canvas.height = 320;
	canvas.style = "width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: -1;";
	document.body.appendChild(canvas);
	document.body.appendChild(startButton);
	let ctx = canvas.getContext("2d");
	let ballRadius = 10;
	let x = canvas.width / 2;
	let y = canvas.height - 30;
	let dx = 2;
	let dy = -2;
	let paddleHeight = 10;
	let paddleWidth = 75;
	let paddleX = (canvas.width - paddleWidth) / 2;
	let rightPressed = false;
	let leftPressed = false;
	let brickRowCount = 5;
	let brickColumnCount = 3;
	let brickWidth = 75;
	let brickHeight = 20;
	let brickPadding = 10;
	let brickOffsetTop = 30;
	let brickOffsetLeft = 30;
	let score = 0;
	let lives = 3;

	let bricks = [];
	for (let c = 0; c < brickColumnCount; c++) {
		bricks[c] = [];
		for (let r = 0; r < brickRowCount; r++) {
			bricks[c][r] = {
				x: 0,
				y: 0,
				status: 1
			};
		}
	}

	document.addEventListener("keydown", keyDownHandler, false);
	document.addEventListener("keyup", keyUpHandler, false);
	document.addEventListener("mousemove", mouseMoveHandler, false);

	function keyDownHandler(e) {
		if (e.code == "ArrowRight") {
			rightPressed = true;
		} else if (e.code == 'ArrowLeft') {
			leftPressed = true;
		}
	}

	function keyUpHandler(e) {
		if (e.code == 'ArrowRight') {
			rightPressed = false;
		} else if (e.code == 'ArrowLeft') {
			leftPressed = false;
		}
	}

	function mouseMoveHandler(e) {
		let relativeX = e.clientX - canvas.offsetLeft;
		if (relativeX > 0 && relativeX < canvas.width) {
			paddleX = relativeX - paddleWidth / 2;
		}
	}

	function collisionDetection() {
		for (let c = 0; c < brickColumnCount; c++) {
			for (let r = 0; r < brickRowCount; r++) {
				let b = bricks[c][r];
				if (b.status == 1) {
					if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
						dy = -dy;
						b.status = 0;
						score++;
						if (score == brickRowCount * brickColumnCount) {
							throw new Error("stop game");
						}
					}
				}
			}
		}
	}

	function drawBall() {
		ctx.beginPath();
		ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
		ctx.fillStyle = "#0095DD";
		ctx.fill();
		ctx.closePath();
	}

	function drawPaddle() {
		ctx.beginPath();
		ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
		ctx.fillStyle = "#0095DD";
		ctx.fill();
		ctx.closePath();
	}

	function drawBricks() {
		for (let c = 0; c < brickColumnCount; c++) {
			for (let r = 0; r < brickRowCount; r++) {
				if (bricks[c][r].status == 1) {
					let brickX = (r * (brickWidth + brickPadding)) + brickOffsetLeft;
					let brickY = (c * (brickHeight + brickPadding)) + brickOffsetTop;
					bricks[c][r].x = brickX;
					bricks[c][r].y = brickY;
					ctx.beginPath();
					ctx.rect(brickX, brickY, brickWidth, brickHeight);
					ctx.fillStyle = "#0095DD";
					ctx.fill();
					ctx.closePath();
				}
			}
		}
	}

	function drawScore() {
		ctx.font = "16px Arial";
		ctx.fillStyle = "#0095DD";
		ctx.fillText("Score: " + score, 8, 20);
	}

	function drawLives() {
		ctx.font = "16px Arial";
		ctx.fillStyle = "#0095DD";
		ctx.fillText("Lives: " + lives, canvas.width - 65, 20);
	}

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		drawBricks();
		drawBall();
		drawPaddle();
		drawScore();
		drawLives();
		collisionDetection();

		if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
			dx = -dx;
		}
		if (y + dy < ballRadius) {
			dy = -dy;
		} else if (y + dy > canvas.height - ballRadius) {
			if (x > paddleX && x < paddleX + paddleWidth) {
				dy = -dy;
			} else {
				lives--;
				if (!lives) {
					throw new Error("stop game");
				} else {
					x = canvas.width / 2;
					y = canvas.height - 30;
					dx = 2;
					dy = -2;
					paddleX = (canvas.width - paddleWidth) / 2;
				}
			}
		}

		if (rightPressed && paddleX < canvas.width - paddleWidth) {
			paddleX += 7;
		} else if (leftPressed && paddleX > 0) {
			paddleX -= 7;
		}

		x += dx;
		y += dy;
		requestAnimationFrame(draw);
	}
	startButton.onclick = function() {
		startButton.remove();
		draw();
	}
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
});
null;