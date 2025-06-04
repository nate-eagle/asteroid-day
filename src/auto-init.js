import { createCountdownTimer, createAsteroidsGame } from "./index.js";

const ASTEROIDS_GAME_ID = "asteroids-day-game";

function domReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

// Returns the next Asteroid Day (June 30) based on the current date.
function getNextAsteroidDay() {
  const today = new Date();
  const year = today.getFullYear();

  const thisYearJune30 = new Date(year, 5, 30);

  // If we’re still on or before June 30 of this year, return that.
  // Otherwise, return June 30 of next year.
  if (today <= thisYearJune30) {
    return thisYearJune30;
  } else {
    return new Date(year + 1, 5, 30);
  }
}

domReady(() => {
  const countdownContainer = document.getElementById("asteroid-day-countdown");
  if (!countdownContainer) {
    console.warn(
      "[AsteroidDay] no #asteroid-day-countdown element found; skipping auto-init."
    );
    return;
  }

  createCountdownTimer(countdownContainer, {
    endTime: getNextAsteroidDay().toISOString(),
  });

  let currentGame = null; // Track the current game instance
  countdownContainer.addEventListener("click", () => {
    // If a game already exists, don’t recreate it:
    if (currentGame) return;

    const gameContainer = document.createElement("div");
    const message = document.createElement("div");
    message.innerHTML = `
    	<div class="asteroid-day-message">
        <p>We proudly support humanity&rsquo;s efforts to protect the earth from asteroids.</p>
        <p><a href="https://asteroidday.org/">Learn more about Asteroid Day</a></p>
      </div>
    `;
    const gameDiv = document.createElement("div");
    gameContainer.id = ASTEROIDS_GAME_ID + "-container";
    gameDiv.id = ASTEROIDS_GAME_ID;
    gameContainer.appendChild(gameDiv);
    gameContainer.appendChild(message);
    document.body.appendChild(gameContainer);

    currentGame = createAsteroidsGame(gameDiv, {});

    function endGame() {
      currentGame.end();
      currentGame = null;

      // Clean up
      document.body.removeChild(gameContainer);
      document.removeEventListener("click", onDocumentClick, true);
      document.removeEventListener("keyup", onEscapeKey, true);
    }

    function onDocumentClick(evt) {
      // If the click target is inside gameDiv, ignore
      if (gameDiv.contains(evt.target)) return;
      if (message === evt.target || message.contains(evt.target)) return;
      endGame();
    }

    function onEscapeKey(evt) {
      // If Escape key pressed, end the game
      if (evt.key === "Escape") {
        endGame();
      }
    }

    document.addEventListener("keyup", onEscapeKey, true);
    document.addEventListener("click", onDocumentClick, true);
  });
});
