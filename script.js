const canvas = document.querySelector("#sky");
const ctx = canvas.getContext("2d");
const musicButton = document.querySelector("#musicButton");
const musicLabel = document.querySelector("#musicLabel");

let width = 0;
let height = 0;
let particles = [];
let audioContext;
let masterGain;
let musicTimer;
let isPlaying = false;

const notes = [261.63, 329.63, 392.0, 493.88, 523.25, 392.0, 329.63, 293.66];

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const particleCount = Math.min(80, Math.max(34, Math.floor(width / 18)));
  particles = Array.from({ length: particleCount }, createParticle);
}

function createParticle() {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2.8 + 1.2,
    speed: Math.random() * 0.22 + 0.08,
    drift: Math.random() * 0.34 - 0.17,
    phase: Math.random() * Math.PI * 2,
    hue: Math.random() > 0.45 ? "255, 226, 213" : "207, 224, 255"
  };
}

function drawHeart(x, y, size, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -3, -12, 6, 0, 13);
  ctx.bezierCurveTo(12, 6, 9, -3, 0, 5);
  ctx.fillStyle = `rgba(255, 218, 207, ${alpha})`;
  ctx.fill();
  ctx.restore();
}

function animateSky(time = 0) {
  ctx.clearRect(0, 0, width, height);

  for (const particle of particles) {
    particle.y -= particle.speed;
    particle.x += particle.drift + Math.sin(time * 0.001 + particle.phase) * 0.12;

    if (particle.y < -24) {
      particle.y = height + 24;
      particle.x = Math.random() * width;
    }

    if (particle.x < -24) particle.x = width + 24;
    if (particle.x > width + 24) particle.x = -24;

    const alpha = 0.18 + Math.sin(time * 0.0015 + particle.phase) * 0.08;
    ctx.beginPath();
    ctx.fillStyle = `rgba(${particle.hue}, ${alpha})`;
    ctx.shadowColor = `rgba(${particle.hue}, 0.42)`;
    ctx.shadowBlur = 14;
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  if (width > 520) {
    drawHeart(width * 0.12 + Math.sin(time * 0.0007) * 12, height * 0.78, 30, 0.16);
    drawHeart(width * 0.86 + Math.cos(time * 0.0008) * 10, height * 0.22, 22, 0.13);
  }

  requestAnimationFrame(animateSky);
}

function playTone(frequency, start, duration, volume) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

function scheduleMusic() {
  const now = audioContext.currentTime;

  notes.forEach((note, index) => {
    const start = now + index * 0.72;
    playTone(note, start, 0.62, 0.06);
    playTone(note / 2, start, 1.2, 0.035);
  });
}

function startMusic() {
  audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  masterGain = masterGain || audioContext.createGain();
  masterGain.gain.cancelScheduledValues(audioContext.currentTime);
  masterGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.72, audioContext.currentTime + 0.5);
  masterGain.connect(audioContext.destination);

  audioContext.resume();
  scheduleMusic();
  musicTimer = window.setInterval(scheduleMusic, notes.length * 720);
  isPlaying = true;
  musicButton.setAttribute("aria-pressed", "true");
  musicLabel.textContent = "Mettre en pause";
}

function stopMusic() {
  window.clearInterval(musicTimer);
  if (masterGain) {
    const gainToDisconnect = masterGain;
    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.08);
    window.setTimeout(() => {
      gainToDisconnect.disconnect();
      if (masterGain === gainToDisconnect) masterGain = null;
    }, 300);
  }
  isPlaying = false;
  musicButton.setAttribute("aria-pressed", "false");
  musicLabel.textContent = "Lancer la musique";
}

musicButton.addEventListener("click", () => {
  if (isPlaying) {
    stopMusic();
    return;
  }

  startMusic();
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
animateSky();
