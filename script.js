let video = document.getElementById("video");
let canvas = document.getElementById("output");
let ctx = canvas.getContext("2d");
let detector;

let repCount = 0;
let squatDown = false;
let exerciseType = "squat";

const counterDisplay = document.getElementById("counter");
const exerciseSelect = document.getElementById("exercise");

// setup
async function setupCamera() {
    video.width = 640;
    video.height = 480;
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });
    video.srcObject = stream;

    return new Promise(resolve => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

// loader
async function loadModel() {
    detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
    );
}

function getAngle(a, b, c) {
    let ab = { x: a.x - b.x, y: a.y - b.y };
    let cb = { x: c.x - b.x, y: c.y - b.y };
    let dot = ab.x * cb.x +ab.y * cb.y;
    let abLen = Math.sqrt(ab.x**2 + ab.y**2);
    let cbLen = Math.sqrt(cb.x**2 + cb.y**2);
    return Math.acos(dot / (abLen * cbLen)) * (180 / Math.PI);
}

// detection loop
async function detectPose() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (detector) {
        const poses = await detector.estimatePoses(video);

        if (poses.length > 0) {
            const keypoints = poses[0].keypoints;
            for (let kp of keypoints) {
                if (kp.score > 0.5) {
                    ctx.beginPath();
                    ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = "lime";
                    ctx.fill();
                }
            }

            if (exerciseType == "squat") {
                let hip = keypoints.find(k => k.name === "right_hip");
                let knee = keypoints.find(k => k.name === "right_knee");
                let ankle = keypoints.find(k => k.name === "right_ankle");

                if (hip && knee && ankle && hip.score > 0.5 && knee.score > 0.5 && ankle.score > 0.5) {
                    let angle = getAngle(hip, knee, ankle);

                    ctx.fillStyle = "yellow";
                    ctx.font = "20px Arial";
                    ctx.fillText("Angle: " + Math.round(angle), 20, 40);

                    if (angle < 100 && !squatDown) {
                        squatDown = true;
                    }
                    if (angle > 160 && squatDown) {
                        repCount++;
                        squatDown = false;
                        counterDisplay.innerText = `reps: ${repCount}`;
                    }
                }
            }
        }
    }
    requestAnimationFrame(detectPose);
}

// main
async function init() {
    await setupCamera();
    await loadModel();
    detectPose();
}

exerciseSelect.addEventListener("change", () => {
    exerciseType = exerciseSelect.value;
    repCount = 0;
    counterDisplay.innerText = "reps: 0";
})

init();
