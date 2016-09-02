// Initialise variables related to the audio element.
let audioElement = document.getElementById('audio-player');
let audioContext = new AudioContext();
let audioSource = audioContext.createMediaElementSource(audioElement);
let audioAnalyser = audioContext.createAnalyser();
audioSource.connect(audioAnalyser);
audioSource.connect(audioContext.destination);

// Initialise the waveform data.
const dataPointCount = 1024;
audioAnalyser.fftSize = dataPointCount;
let waveformData = new Float32Array(dataPointCount);
const amplitudeScaleFactor = 4.0;

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
	audioElement.src = URL.createObjectURL(audioFileInput.files[0]);
}

window.onresize = function(event) {
	// Resize the canvas to match the new page size.
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	// Blank the canvas with the black background colour.
	canvasContext.save();
	canvasContext.fillStyle = '#000000';
	canvasContext.globalCompositeOperation = 'source-over';
	canvasContext.fillRect(0, 0, canvas.width, canvas.height);
	canvasContext.restore();
}

// Resize the canvas to match the initial window size.
window.onresize();

// Start the rendering loop.
window.requestAnimationFrame(renderFrame);