import { getCurvePoints } from 'cardinal-spline-js/curve_calc.min.js';
import { add, multiply, divide, complex, pow } from 'mathjs';

var numCircles = 4; // Edited by user
var drawSpeed = 50; // Edited by user
var isDrawing = true;
var mouseDown = false;
var history = [];
const historySize = 90;
const colorUserDraw = "#35353d";
const colorAlgoDraw = "#ef3991";
const colorHighlight = "#3979ef";

var points = [];
var interval = null;
var t = 0;
var coeffs = [];

var canvas = null;
var ctx = null;
var sizeX = 0;
var sizeY = 0;
var offsetX = 0;
var offsetY = 0;


// JQuery works because it is included to use bootstrap (which may be silly - bootstrap probably isn't needed for this basic UI)
$("#SliderNumCircles").on("input", function() {
	numCircles = parseInt($("#SliderNumCircles").val());
	$("#NumCirclesTxt").text("Resolution: " + numCircles);
});
$("#SliderDrawSpeed").on("input", function() {
	drawSpeed = parseInt($("#SliderDrawSpeed").val());
	$("#DrawSpeedTxt").text("Drawing Speed: " + drawSpeed);
});
$("#DrawButton").click(function() {
	drawMode();
	$("#AnimateButton").removeClass("btn-primary");
	$("#AnimateButton").addClass("btn-outline-primary");
	$("#DrawButton").removeClass("btn-outline-primary");
	$("#DrawButton").addClass("btn-primary");
});
$("#AnimateButton").click(function() {
	animateMode();
	$("#DrawButton").removeClass("btn-primary");
	$("#DrawButton").addClass("btn-outline-primary");
	$("#AnimateButton").removeClass("btn-outline-primary");
	$("#AnimateButton").addClass("btn-primary");
});
$(document).ready(function() {
	setupCanvas();
	updateCanvasDraw();
	$("#SliderNumCircles").trigger("input");
	$("#SliderDrawSpeed").trigger("input");
});


function handleMouseDown(e) {
	if(isDrawing)
		points = [];
	mouseDown = true;
}
function handleMouseUp(e) {
	mouseDown = false;
}
function handleMouseMove(e) {
	if(isDrawing && mouseDown){
		points.push([e.offsetX, e.offsetY]);
		updateCanvasDraw(); // TODO don't erase the whole thing every time, only draw new points when in draw mode
	}
}


function setupCanvas() {
	canvas = document.getElementById('my-canvas');
	ctx = canvas.getContext('2d');

	sizeX = window.innerWidth;
	sizeY = window.innerHeight;
	canvas.width = sizeX-20;
	canvas.height = sizeY-60; // TODO account for height in components above this
	offsetX = sizeX/2;
	offsetY = sizeY/2;

	canvas.addEventListener('mousedown', handleMouseDown);
	canvas.addEventListener('mouseup', handleMouseUp);
	canvas.addEventListener('mousemove', handleMouseMove);
}

function drawMode() {
	clearInterval(interval);
	points = [];
	updateCanvasDraw();
	isDrawing = true;
}
function animateMode() {
	clearInterval(interval); // TODO need this?
	coeffs = [];
	history = [];
	isDrawing = false;
	generateAnimation();
}

/* function getPathSize(path){
	var xs = [];
	var ys = [];
	for(var i=0; i<path.length-1; i+=2*2){ // adjust +=2*x to determine resolution
		xs.push(path[i]);
		ys.push(path[i+1]);
	}
	var minx = Math.min(...xs);
	var miny = Math.min(...ys);
	return [minx, miny, Math.max(...xs)-minx, Math.max(...ys)-miny];
} */

function generateAnimation() { // TODO allow changing resolution during the animation
	var pointsFlat = points.flat(1);
	var pathRaw = getCurvePoints(pointsFlat, 0.25, 5, true); // third argument determines curve resolution
	var pathX = [];
	var pathY = [];
	for (var i = 0; i < pathRaw.length-1; i+=2) {
		pathX.push(pathRaw[i]);
		pathY.push(pathRaw[i+1]);
	}

	ctx.fillStyle = colorHighlight;
	for (var i = 0; i < pathX.length; i++) {
		ctx.beginPath();
		ctx.arc(pathX[i], pathY[i], 2, 1, 2*Math.PI);
		ctx.fill();
	}

	// var pathSize = getPathSize(pathRaw);
	// ctx.beginPath();
	// ctx.rect(pathSize[0], pathSize[1], pathSize[2], pathSize[3]);
	// ctx.stroke();

	for (var i = -numCircles; i < numCircles; i++) {
		coeffs.push(simpleCCalc(pathX, pathY, i));
	}

	interval = setInterval(runAnimation, 60);
}

function simpleCCalc(pathX, pathY, sub) {
	var steps = 400.0;
	var pathLength = pathX.length;
	var bigsum = 0;
	for (var bigi = 0; bigi < steps; bigi++) { // approximates integral by using "steps"
		var i = bigi/steps; // basically percentage along the curve
		var pointIndex = Math.floor(i*pathLength);
		var pointx = pathX[pointIndex];
		var pointy = pathY[pointIndex];
		//var pointxScaled = (pointx-(pathSize[0]+pathSize[2]/2))/pathSize[2];
		//var pointyScaled = (pointy-(pathSize[1]+pathSize[3]/2))/pathSize[3];
		var pointxScaled = (pointx-sizeX/2)/(sizeX/2);
		var pointyScaled = (pointy-sizeY/2)/(sizeX/2);
		//var pointUnscaled = imagToCoords(complex(pointxScaled, pointyScaled));
		//var pointComplex = complex(pointx, pointy);
		var pointComplex = complex(pointxScaled, pointyScaled);
		var powPart = pow(Math.E, complex(0, -sub*2*Math.PI*i));
		var adding = multiply(pointComplex, powPart);
		bigsum = add(bigsum, adding);
	}
	return divide(bigsum, steps);
}
function imagToCoords(num) {
	return [(num.re*(sizeX/2))+sizeX/2, (num.im*(sizeX/2))+sizeY/2]
}



function updateCanvasDraw() { // only runs in Draw Mode
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// ctx.fillStyle = "black";
	// ctx.font="12px Georgia";
	// ctx.fillText("Points: " + points.length, 20, sizeY-80);

	ctx.fillStyle = "black";
	ctx.fillRect(offsetX-2, offsetY-2, 4, 4);

	ctx.fillStyle = colorUserDraw;
	for (var i = points.length - 1; i >= 0; i--) {
		ctx.beginPath();
		ctx.arc(points[i][0], points[i][1], 4, 1, 2*Math.PI);
		ctx.fill();
	}
}

function runAnimation() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	t += 0.012*((drawSpeed + 10)/100); // Convert draw speed from user to frame delay value
	if(t >= 1){
		t = 0;
	}

	ctx.fillStyle = colorUserDraw;
	for (var i = points.length - 1; i >= 0; i--) {
		ctx.beginPath();
		ctx.arc(points[i][0], points[i][1], 4, 1, 2*Math.PI);
		ctx.fill();
	}

	ctx.fillStyle = colorAlgoDraw;
	for (var i = history.length - 1; i >= 0; i--) {
		ctx.beginPath();
		ctx.arc(history[i][0], history[i][1], 3, 1, 2*Math.PI);
		ctx.fill();
	}

	var finalPoint_c = complex(0, 0);
	var oldPoint = [offsetX, offsetY];

	for (var i = -numCircles; i < numCircles; i++) {
		var newPoint_c = multiply(coeffs[i+parseInt(numCircles)], pow(Math.E, complex(0, -i*2*Math.PI*t)));
		//var newPoint = imagToCoords(newPoint_c);
		var newPoint_rad = (sizeX/2)*Math.hypot(newPoint_c.re, newPoint_c.im);
		//var newPoint_rad = Math.hypot((sizeX/2)*newPoint_c.re, (sizeY/2)*newPoint_c.im);
		var latestPoint = imagToCoords(finalPoint_c);

		// large circle
		ctx.fillStyle = "black";
		ctx.beginPath();
		ctx.arc(latestPoint[0], latestPoint[1], newPoint_rad, 0, 2*Math.PI);
		ctx.stroke();

		ctx.fillStyle = "grey";
		ctx.beginPath();
		ctx.arc(latestPoint[0], latestPoint[1], 2, 0, 2*Math.PI);
		ctx.fill();

		ctx.fillStyle = "black";
		ctx.beginPath();
		ctx.moveTo(latestPoint[0], latestPoint[1]);
		ctx.lineTo(oldPoint[0], oldPoint[1]);
		ctx.stroke();
		//ctx.moveTo(0, 0);

		finalPoint_c = add(finalPoint_c, newPoint_c);
		oldPoint = latestPoint;
	}

	var finalPoint = imagToCoords(finalPoint_c);
	ctx.fillStyle = colorHighlight;
	ctx.beginPath();
	ctx.arc(finalPoint[0], finalPoint[1], 6, 0, 2*Math.PI);
	ctx.fill();

	history.push(finalPoint);
	if (history.length > historySize){
		history.shift();
	}
}
