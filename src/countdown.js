// src/countdown.js
import "./countdown.css";
import asteroidIconUrl from "./asteroid.svg";

export function createCountdownTimer(containerElement, { endTime }) {
  if (!containerElement) throw new Error("Must pass a container element.");
  if (!endTime) throw new Error("Must pass an endTime string.");

  const img = new Image();
  img.src = asteroidIconUrl;
  img.alt = "Asteroid icon";
  img.style.width = "30px";
  img.style.height = "30px";
  // Position it or draw it on a <canvas> as needed...
  containerElement.appendChild(img);

  const targetDate = new Date(endTime);

  // Create a wrapper div with a known class so CSS can target it
  const display = document.createElement("div");
  display.className = "countdown-timer";
  containerElement.appendChild(display);

  let timerId = null;

  function update() {
    const now = new Date();
    const diffMs = targetDate - now;

    if (diffMs <= 0) {
      display.textContent = "00 days 00:00:00";
      clearInterval(timerId);
      return;
    }

    const totalSeconds = Math.floor(diffMs / 1000);

    // Compute days, then remainder hours/minutes/seconds
    const days = Math.floor(totalSeconds / 86400); // 86400 = 24*3600
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Pad hours/minutes/seconds to always be two digits
    const hStr = String(hours).padStart(2, "0");
    const mStr = String(minutes).padStart(2, "0");
    const sStr = String(seconds).padStart(2, "0");

    display.innerHTML =
      `<span class="days">${days}</span>&nbsp;<b>day${
        days !== 1 ? "s" : ""
      }</b>&nbsp;<span class="digits">` +
      [
        `<span class="hours">${hStr}</span>`,
        `<span class="minutes">${mStr}</span>`,
        `<span class="seconds">${sStr}</span>`,
      ].join(":") +
      "</span>";
  }

  // Do one immediate update, then tick every second
  update();
  timerId = setInterval(update, 1000);

  return {
    destroy() {
      clearInterval(timerId);
      containerElement.removeChild(img);
      containerElement.removeChild(display);
    },
  };
}
