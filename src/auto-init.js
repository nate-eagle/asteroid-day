// src/auto-init.js
import { createCountdownTimer, createAsteroidsGame } from "./index.js";

// You can hard‐wire these IDs, or optionally read them from data‐attributes.
// Here we assume:
//   <div id="asteroid-day-countdown"></div>
// calls -> createCountdownTimer(...), then on click -> spawn game.

const ASTEROIDS_GAME_ID = "asteroids-day-game";

function domReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

function getNextAsteroidDay() {
  const today = new Date();
  const year = today.getFullYear();

  // JS Date months are zero-based (0 = January, …, 5 = June, 11 = December).
  // Construct June 30 of the current year:
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
  // 1) Find the countdown container
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
        <p>LeoLabs is a proud supporter of humanity&rsquo;s efforts to protect the earth from asteroids.</p>
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

    // 3) Once the game is running, listen for clicks _outside_ gameDiv
    //    to shut it down:
    function endGame() {
      // Otherwise, end & remove:
      currentGame.end();
      currentGame = null;

      // Clean up:
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

    // Use capture=true so we catch clicks early, before the game’s own handling:
    document.addEventListener("click", onDocumentClick, true);
  });
});
