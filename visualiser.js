'use strict';

// Initialise variables related to the audio player.
let audioElement = document.getElementById('audio-player');
let audioContext = new AudioContext();
let audioSource = audioContext.createMediaElementSource(audioElement);
let audioAnalyser = audioContext.createAnalyser();
audioSource.connect(audioAnalyser);
audioSource.connect(audioContext.destination);
let scaler = document.getElementById('scaler');
let scalerLabel = document.getElementById('scaler-label');
let controls = document.getElementById('controls');

// Initialise the waveform data.
const dataPointCount = 1024;
audioAnalyser.fftSize = dataPointCount;
let waveformData = new Float32Array(dataPointCount);

// Initialise variables related to the canvas.
let canvas = document.getElementById('visualiser');
let canvasContext = canvas.getContext('2d');

// Initialise the waveform to 0 at all points.
let topPath = new Array(dataPointCount);
let bottomPath = new Array(dataPointCount);
for (let i = 0; i < dataPointCount; ++i) {
	topPath[i] = 0.0;
	bottomPath[i] = 0.0;
}

// Assign the constant speed factors by which the waveform rises and falls.
const waveformRise = 0.4;
const waveformFall = 0.2;

function renderFrame() {

	// Build the waveform path to be rendered later.
	audioAnalyser.getFloatTimeDomainData(waveformData);
	for (let i = 0; i < dataPointCount; ++i) {

		let topValue = 0.0;
		let bottomValue = 0.0;

		let currentValue = waveformData[i];
		if (currentValue < 0.0) {
			topValue = currentValue;
		} else {
			bottomValue = currentValue;
		}

		// Allow the waveform to rise faster than it falls.
		if (topValue < topPath[i]) {
			topPath[i] = (topValue - topPath[i]) * waveformRise + topPath[i];
		} else {
			topPath[i] = (topValue - topPath[i]) * waveformFall + topPath[i];
		}
		if (bottomValue > bottomPath[i]) {
			bottomPath[i] = (bottomValue - bottomPath[i]) * waveformRise + bottomPath[i];
		} else {
			bottomPath[i] = (bottomValue - bottomPath[i]) * waveformFall + bottomPath[i];
		}

	}

	// Scale the waveform amplitude such that volume is not a factor.
	let volumeScaleFactor = (audioElement.volume > 0.01) ? (1.0 / audioElement.volume) : 1.0;
	// Scale the waveform amplitude based on a user-adjustable slider.
	let amplitudeScaleFactor = scaler.value / 100.0;
	let newLabel = 'Amplitude Scale Factor: ' + amplitudeScaleFactor.toFixed(3);
	if (scalerLabel.textContent != newLabel) scalerLabel.textContent = newLabel;

	// Begin drawing to the canvas, first by saving the current canvas state.
	canvasContext.save();

	// Cover the canvas with a transparent background colour to fade what currently exists.
	canvasContext.fillStyle = 'rgba(80%, 86%, 92%, 0.75)';
	canvasContext.globalCompositeOperation = 'multiply';
	canvasContext.fillRect(0, 0, canvas.width, canvas.height);
	canvasContext.globalCompositeOperation = 'source-over';

	// Draw the paths in 'topPath' and 'bottomPath' as one solid object.
	let canvasVerticalCentre = canvas.height * 0.5;
	canvasContext.beginPath();
	canvasContext.moveTo(0, canvasVerticalCentre);
	for (let i = 0; i < dataPointCount; ++i) {
		let x = (i / (dataPointCount - 1)) * canvas.width;
		canvasContext.lineTo(x, canvasVerticalCentre + topPath[i] * canvasVerticalCentre
			* amplitudeScaleFactor * volumeScaleFactor);
	}
	for (let i = dataPointCount - 1; i >= 0; --i) {
		let x = (i / (dataPointCount - 1)) * canvas.width;
		canvasContext.lineTo(x, canvasVerticalCentre + bottomPath[i] * canvasVerticalCentre
			* amplitudeScaleFactor * volumeScaleFactor);
	}
	canvasContext.fillStyle = '#EEFFEE';

	// Add a shadow, as a blur.
	canvasContext.shadowBlur = 8;
	canvasContext.shadowColor = 'rgba(40%, 100%, 80%, 0.2)';

	// Perform the drawing.
	canvasContext.fill();

	// Restore the canvas to its original state.
	canvasContext.restore();

	// Request that this function be called again when appropriate.
	window.requestAnimationFrame(renderFrame);

}

// Handle changes to the file input.
let audioFileInput = document.getElementById('audio-file-input');
function audioFileChanged() {
	if (audioFileInput.files.length) {
		audioElement.src = URL.createObjectURL(audioFileInput.files[0]);
	}
}
// If a file is already specified from a previous page view, load it immediately.
audioFileChanged();

window.onresize = function(event) {
	// Resize the canvas to match the new page size.
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	// Blank the canvas with the black background colour.
	canvasContext.save();
	canvasContext.fillStyle = '#030408';
	canvasContext.globalCompositeOperation = 'source-over';
	canvasContext.fillRect(0, 0, canvas.width, canvas.height);
	canvasContext.restore();
}

// Resize the canvas to match the initial window size.
window.onresize();

// Hide the mouse cursor and controls if the mouse is stationary over the canvas for a while.
let inactivityTimeout;
const inactivityTimeoutPeriod = 2500;
document.body.onmousemove = function(event) {
	// The cursor has just moved, so display everything and reset the timeout.
	if (document.documentElement.style.cursor != 'default') {
		document.documentElement.style.cursor = 'default';
	}
	if (controls.style.display != '') {
		controls.style.display = '';
	}
	clearTimeout(inactivityTimeout);
	inactivityTimeout = setTimeout(hideCursorAndControls, inactivityTimeoutPeriod);
}
function hideCursorAndControls() {
	// If the cursor is over the controls, don't hide anything -- reset the timer.
	if (document.body.querySelector(':hover') == controls) {
		inactivityTimeout = setTimeout(hideCursorAndControls, inactivityTimeoutPeriod);
	// Otherwise, hide the cursor and controls via CSS.
	} else {
		document.documentElement.style.cursor = 'none';
		controls.style.display = 'none';
	}
}
// Initialise the inactivity timer from the beginning.
inactivityTimeout = setTimeout(hideCursorAndControls, inactivityTimeoutPeriod);

// Start the rendering loop.
window.requestAnimationFrame(renderFrame);