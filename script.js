let video = document.getElementById("video");
let canvas = document.getElementById("output");
let ctx = canvas.getContext("2d");
let detector;

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

// detection loop
async function detectPose() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (detector) {
    const poses = await detector.estimatePoses(video);

    if (poses.length > 0) {
      for (let kp of poses[0].keypoints) {
        if (kp.score > 0.5) {
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = "lime";
          ctx.fill();
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
init();
