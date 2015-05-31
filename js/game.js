// SHIM TO SUPPORT OLDER BROWSERS

window.requestAnimFrame = (function(callback) {
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function(callback) {
			window.setTimeout(callback, 1000 / 60);
		};
})();

var canvas;
var context;
var valid;
var firstAnim;
var mx, my;
var offsetx, offsety;

var ball;
var table;
var paddle;
var opponent;
var HALScore;
var playerScore;

var drag;
var inPlay;
var newDrag;
var serving;
var checkWin;
var pointWon;
var firstShot;
var returnMade;

var ballMessage;
var serveMessage;

var swing;
var swingScore;
var swingDirection;

// CONSTRUCTORS

function Table(leftEdge, rightEdge) {

	this.leftEdge = leftEdge;
	this.rightEdge = rightEdge;
}


function Ball(x, y, z, radius) {

	this.x = x;
	this.y = y;
	this.z = z;
	this.radius = radius;
	this.startAngle = 0;
	this.endAngle = 2 * Math.PI;
	this.updateX = 0;
	this.updateZ = 0;
	this.updateY = 3;
	this.unSignUpdateY = 3;
	this.updateRadius = 0;
}


function Paddle(x, y) {

	this.x = x;
	this.y = y;
	this.radius = 40;
}


function Opponent(x, y) {

	this.x = x;
	this.y = y;
	this.radius = 30;
	this.updateX = 0;
}

function Handle(x1, y1, x2, y2) {

	this.x1 = x1;
	this.y1 = y1;
	this.x2 = x2;
	this.y2 = y2;
}

// EVENT LISTENERS 
function myDown(e) {

	getMouse(e);
}

function myUp(e) {

	getMouse(e);
}

// CALL ON PAGE LOAD TO CREATE TABLE OBJECT AND INITIAL MESSAGE
function setup() {

	canvas = document.getElementById('pingpong');
	context = canvas.getContext('2d');
	table = new Table(350, 850);
	HALScore = -1;
	playerScore = 0;
	firstShot = true;
	ballMessage = true
	serveMessage = false;
	serve();
}

function serve(pointWon) {

// IF POINT WON BRING BACK MOUSE POINTER
	myUp();

	if (pointWon == true) {
		playerScore++;
	} else {
		HALScore++;
	}

	// CHECK WIN
	if (playerScore < 10) {
		document.getElementById('first-score').innerHTML = "0" + playerScore;
	} else {
		document.getElementById('first-score').innerHTML = playerScore;
	}

	if (HALScore < 10) {
		document.getElementById('second-score').innerHTML = "0" + HALScore;
	} else {
		document.getElementById('second-score').innerHTML = HALScore;
	}

	if (HALScore >= 5 && playerScore < HALScore - 1) {
		document.getElementById('first-player').innerHTML = "YOU";
		document.getElementById('second-player').innerHTML = "LOSE";
		setup();
		return;
	}

	if (playerScore >= 5 && HALScore < playerScore - 1) {
		document.getElementById('first-player').innerHTML = "YOU";
		document.getElementById('second-player').innerHTML = "WIN";
		setup();
		return;
	}

	// OTHERWISE SET UP NEXT POINT
	ball = new Ball((canvas.width / 2), 220, 0, 16);
	paddle = new Paddle(500, 200);
	opponent = new Opponent(700, 200);
	swingDirection = 0;

	inPlay = false;
	serving = true;
	newDrag = true;
	checkWin = false;
	pointWon = false;
	returnMade = false;

	// ALLOW ONE FULL ANIMATION TO REDRAW TABLE
	valid = false;
	firstAnim = true;
	animate();
}


function animate() {

	// SET EVENT LISTENERS
	canvas.onmousedown = myDown;
	canvas.onmouseup = myUp;

	// ALLOW SOME LEEWAY WITH WHEN RETURN CAN BE MADE
	if (ball.z < 20 && returnMade === false) {
		var hitBall = checkHitPaddle(ball.x, canvas.height - ball.y, paddle.x, paddle.y, paddle.radius - (ball.radius / 2));
		if (hitBall) {
			if (serving && swing < 0) {
				// ONE OFF SERVE INSTRUCTION
				if (serveMessage === false) {
					document.getElementById('first-player').innerHTML = "PLS SERVE";
					document.getElementById('second-player').innerHTML = "RIGHT";
					serveMessage = true;
				}
			} else {

				if (serving) {
					serving = false;
				}

				inPlay = true;

				// CALCULATE THE HORIZONTAL MOVEMENT
				swingScore = swing / 60;
				ball.updateX = swingScore;
				returnMade = true;

				// IF FIRST SHOT SHOW SCORE
				if (firstShot || serveMessage) {

					document.getElementById('first-player').innerHTML = "PLAYER 1";
					document.getElementById('second-player').innerHTML = "HAL 3000";
					firstShot = false;
				}
			}
		}
	}

	if (inPlay) {

		// KEEP BALL BOUNCING ON Y AXIS
		if (ball.y === 280) {
			ball.updateY = -(ball.unSignUpdateY);
		}

		// IF AT TABLE HEIGHT CHECK IF STILL ON TABLE
		if (ball.y === 160) {
			if (ball.x < table.leftEdge - (ball.radius / 2) || ball.x > table.rightEdge + (ball.radius / 2)) {

				returnMade = false;
				checkWin = false;

				// ALLOW BALL TO FALL BELOW TABLE
				if (ball.updateZ === -1) {
					pointWon = true;
				}

			} else {
				ball.updateY = (ball.unSignUpdateY);
				pointWon = false;
			}
		}

		if (ball.z === 0) {

			if (returnMade === false) {
				inPlay = false;
				serve(pointWon);
				return;
			} else {

				// MAKE RETURN
				ball.updateZ = 1;
				ball.updateRadius = -(8 / ((60 / ball.unSignUpdateY) * 4));

				// CALCULATE OPPONENT'S MOVEMENT
				opponent.updateX = swingScore + ((ball.x - opponent.x) / ((60 / ball.unSignUpdateY) * 4));
				// IF TOO FAR CHECK WIN
				if (opponent.updateX > 3.3) {
					opponent.updateX = 3.3;
					checkWin = true;
				}

				if (opponent.updateX < -3.3) {
					opponent.updateX = -3.3;
					checkWin = true;
				}
			}
		}

		// OPPONENT RETURN

		if (ball.z === ((60 / ball.unSignUpdateY) * 4)) {
			if (checkWin) {
				returnMade = checkHitPaddle(ball.x, canvas.height - ball.y, opponent.x, opponent.y, (opponent.radius + (ball.radius)));
				pointWon = true;
			}

			if (returnMade === false) {
				inPlay = false;
				serve(pointWon);
				return;
			}

			// VERY SIMPLE OPPONENT AI 
			var extra = ((Math.random() * 0.6) + 0.6);
			if (opponent.x < table.leftEdge + 50 || opponent.x > table.rightEdge - 50) {
				var randomReturn = (Math.random() * swingScore) * (extra * extra);
				ball.updateX = -(randomReturn);
				if (opponent.x - table.leftEdge > table.rightEdge - opponent.x) {
					opponent.updateX = -1 * extra;
				} else {
					opponent.updateX = 1 * extra;
				}
			} else {

				var direction = Math.random() < 0.5;
				if (direction < 0.5) {
					ball.updateX = -((opponent.x - table.leftEdge) / ((60 / ball.unSignUpdateY) * 4)) * extra;
				} else {
					ball.updateX = (table.rightEdge - opponent.x) / ((60 / ball.unSignUpdateY) * 4) * extra;
				}
				if (opponent.x - table.leftEdge > table.rightEdge - opponent.x) {
					opponent.updateX = -1 * extra;
				} else {
					opponent.updateX = 1 * extra;
				}
			}

			ball.updateZ = -1;
			returnMade = false;
			ball.updateRadius = 8 / ((60 / ball.unSignUpdateY) * 4);
		}

		ball.x += ball.updateX;
		ball.y += ball.updateY;
		ball.z += ball.updateZ;
		ball.radius += ball.updateRadius;
		opponent.x += opponent.updateX;
	}


	// ================================================================================
	// RENDERING
	// ================================================================================

	// NO NEED TO ANIMATE IF CANVAS STILL VALID
	if (!valid) {

		context.clearRect(0, 0, canvas.width, canvas.height);
		// OPPONENT
		context.beginPath();
		context.arc(opponent.x, canvas.height - opponent.y, opponent.radius, 0, 2 * Math.PI);
		context.closePath();
		context.fillStyle = 'black';
		context.fill();

		// OPPONENT HANDLE
		oppHandle = new Handle(opponent.x + Math.sqrt((30 * 30) - (1 * 1)), canvas.height - opponent.y + 1, opponent.x + Math.sqrt((30 * 30) - (29 * 29)), canvas.height - opponent.y + 29);
		
		context.beginPath();
		context.fillStyle = '#FFCC66';
		context.lineWidth = 1;
		context.strokeStyle = '#FFCC66';
		context.moveTo(oppHandle.x1, oppHandle.y1);
		context.lineTo(oppHandle.x2, oppHandle.y2);
		context.lineTo((oppHandle.x1 - (oppHandle.x1 - oppHandle.x2) / 2) + 7, oppHandle.y1 + ((oppHandle.y2 - oppHandle.y1) / 2) + 7);
		context.closePath();
		context.fill();
		context.stroke();
		context.beginPath();
		context.lineWidth = 11;
		context.moveTo((oppHandle.x1 - (oppHandle.x1 - oppHandle.x2) / 2), oppHandle.y1 + ((oppHandle.y2 - oppHandle.y1) / 2));
		context.lineTo((oppHandle.x1 - (oppHandle.x1 - oppHandle.x2) / 2) + 18.6, oppHandle.y1 + ((oppHandle.y2 - oppHandle.y1) / 2) + 18.6);
		context.closePath();
		context.stroke();

		// BALL BEHIND NET
		if (ball.z > ((60 / ball.unSignUpdateY) * 2)) {
			context.beginPath();
			context.arc(ball.x, canvas.height - ball.y, ball.radius, ball.startAngle, ball.endAngle);
			context.closePath();
			context.fillStyle = '#8ED6FF';
			context.fill();
		}

		// NET CORD
		context.beginPath();
		context.lineWidth = 1;
		context.fillStyle = 'white';
		context.strokeStyle = "black";
		context.moveTo(table.leftEdge - 20, canvas.height - 150);
		context.lineTo(table.leftEdge - 20, canvas.height - 200);
		context.bezierCurveTo((canvas.width / 2), canvas.height - 190, canvas.width / 2, canvas.height - 190, table.rightEdge + 20, canvas.height - 200);
		context.lineTo(table.rightEdge + 20, canvas.height - 194);
		context.bezierCurveTo((canvas.width / 2), canvas.height - 185, canvas.width / 2, canvas.height - 185, table.leftEdge - 20, canvas.height - 194);
		context.moveTo(table.rightEdge + 20, canvas.height - 150);
		context.lineTo(table.rightEdge + 20, canvas.height - 200);
		context.closePath();
		context.fill();

		// FILL THE NET
		for (var i = 0; i < 15; i++) {
			context.moveTo(table.leftEdge - 20, canvas.height - (150 + (i * 3)));
			context.bezierCurveTo((canvas.width / 2), canvas.height - (150 + (i * 3) - 10), canvas.width / 2, canvas.height - (150 + (i * 3) - 10), table.rightEdge + 20, canvas.height - (150 + (i * 3)));
		}
		context.stroke();

		// TABLE
		context.strokeStyle = 'black';
		context.fillStyle = 'black';
		context.fillRect(table.leftEdge, canvas.height - 150, -28, 4);
		context.fillRect(table.leftEdge - 24, canvas.height - 150, 4, -50);
		context.fillRect(table.rightEdge, canvas.height - 150, 28, 4);
		context.fillRect(table.rightEdge + 24, canvas.height - 150, -4, -50);
		context.fillStyle = '#143D29';
		context.fillRect(table.leftEdge, canvas.height - 150, 500, 14);
		context.strokeRect(table.leftEdge, canvas.height - 150, 500, 14);
		context.fillRect(table.leftEdge + 70, canvas.height - 136, 10, 136);
		context.fillRect(table.rightEdge - 70, canvas.height - 136, -10, 136);
		context.strokeRect(table.leftEdge + 70, canvas.height - 136, 10, 136);
		context.strokeRect(table.rightEdge - 70, canvas.height - 136, -10, 136);

		// BALL INFRONT OF NET
		if (ball.z <= ((60 / ball.unSignUpdateY) * 2)) {
			context.beginPath();
			context.arc(ball.x, canvas.height - ball.y, ball.radius, ball.startAngle, ball.endAngle);
			context.closePath();
			context.fillStyle = '#8ED6FF';
			context.fill();
		}

		// PADDLE
		context.beginPath();
		context.arc(paddle.x, canvas.height - paddle.y, 40, 0, 2 * Math.PI);
		context.closePath();
		context.fillStyle = 'red';
		context.fill();
		// HANDLE

		handle = new Handle(paddle.x - Math.sqrt((40 * 40) - (2 * 2)), canvas.height - paddle.y + 2, paddle.x - Math.sqrt((40 * 40) - (38 * 38)), canvas.height - paddle.y + 38);
		context.beginPath();
		context.fillStyle = '#FFCC66';
		context.strokeStyle = '#FFCC66';
		context.moveTo(handle.x1, handle.y1);
		context.lineTo(handle.x2, handle.y2);
		context.lineTo((handle.x1 - (handle.x1 - handle.x2) / 2) - 8, handle.y1 + ((handle.y2 - handle.y1) / 2) + 8);
		context.closePath();
		context.fill();
		context.stroke();
		context.beginPath();
		context.lineWidth = 16;
		context.moveTo((handle.x1 - (handle.x1 - handle.x2) / 2), handle.y1 + ((handle.y2 - handle.y1) / 2));
		context.lineTo((handle.x1 - (handle.x1 - handle.x2) / 2) - 28, handle.y1 + ((handle.y2 - handle.y1) / 2) + 28);
		context.closePath();
		context.stroke();

		if (firstAnim) {
			valid = true;
			firstAnim = false;
		}
	}

	// LOOP TO ALLOW RERENDERING (WILL ONLY REDRAW IF CANVAS IS INVALID)
	requestAnimFrame(function() {

		animate();
	});
}

// EVENT HANDLERS
function getMouse(e) {

	var element = canvas,
		offsetX = 0,
		offsetY = 0;

	if (element.offsetParent) {
		do {
			offsetX += element.offsetLeft;
			offsetY += element.offsetTop;
		} while ((element = element.offsetParent));
	}
	mx = e.pageX - offsetX;
	my = e.pageY - offsetY;
	drag = checkHitPaddle(mx, my, paddle.x, paddle.y, paddle.radius);
	canvas.onmousemove = myMove;
}


function myMove(e) {

	if (drag) {
		getMouse(e);
		// REMOVE CURSOR WHILE PLAYER IS PLAYING
		if (newDrag) {
			document.body.style.cursor = 'none';
			newDrag = false;
		}

		// IF PADDLE HAS MOVED TOO FAR AND CANCELLED DRAG ALLOW THE ANIMATION TO CATCH UP
		if (!drag) {
			drag = true;
		}

		// PRINT A MESSAGE ON FIRST DRAG
		if (ballMessage) {
			document.getElementById('first-player').innerHTML = "OK HIT";
			document.getElementById('second-player').innerHTML = "THE BALL";
			ballMessage = false;
		}

		// TO CONTROL SWING
		if (paddle.x === mx) {
			swingDirection = 0;
			swing = 0
		} else if (paddle.x > mx) {

			if (swingDirection === 1) {
				swingDirection = 0;
				swing = 0
			}
			swing += mx - paddle.x;
		} else {
			if (swingDirection === 0) {
				swingDirection = 1;
				swing = 0;
			}
			// HIGHER VALUE WILL RESULT IN GREATER HORIZONTAL MOVEMENT
			swing += mx - paddle.x;
		}

		paddle.x = mx;
		paddle.y = canvas.height - my;
	}
}

// RECALL CURSOR
function myUp() {

	if (drag) {
		drag = false;
		document.body.style.cursor = 'auto';
		newDrag = true;
	}

	canvas.onmousemove = null;
	// IF THE BALL HASN'T BEEN HIT DO NOT START RENDERING LOOP

	if (!inPlay) {
		valid = true;
	}
}


function checkHitPaddle(ballX, ballY, paddleX, paddleY, paddleRadius) {

	if ((ballX - paddleX) * (ballX - paddleX) + (canvas.height - ballY - paddleY) * (canvas.height - ballY - paddleY) < paddleRadius * paddleRadius) {
		// PADDLE SELECTED OR BALL HIT -- BETTER UPDATE THE CANVAS
		if (valid) {
			valid = false;
		}
		return true;
	}
	return false;
}

// LOAD SETUP ONCE SCRIPT IS LOADED
setup();