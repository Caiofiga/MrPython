import { sendData } from "./webhooks-regador.js";
let playing = false;

function moveDiv(value) {
  let sensitivity = 0.4;
  let div = document.getElementById("movable");
  let plant1pos = document.getElementById("plant1").getBoundingClientRect();
  let plant5pos = document.getElementById("plant5").getBoundingClientRect();
  let x =
    (plant1pos.left + plant5pos.right) / 2 +
    ((plant5pos.right + 40) * value * sensitivity) / 100;
  div.style.left = x + "px";
}

// This function will be triggered by the WebSocket logic
export function handleMovement(deltaX) {
  moveDiv(deltaX); // Move the div by deltaX
}

function isOverlapping(pos1, pos2) {
  return !(pos2.left > pos1.right || pos2.left < pos1.left);
}

let time = 0;
let timeinterval = null;

const plants = document.querySelectorAll(".plant");
const wateringcan = document.getElementById("movable");

function plantinterval() {
  plants.forEach((plant) => {
    if (
      isOverlapping(
        plant.getBoundingClientRect(),
        wateringcan.getBoundingClientRect()
      )
    ) {
      const event = new CustomEvent("overlap", {
        detail: {
          plantId: plant.id,
        },
      });
      wateringcan.dispatchEvent(event);
    }
  });
}

setInterval(plantinterval, 100);

document.getElementById("startButton").addEventListener("click", () => {
  wateringcan.addEventListener("overlap", handleOverlap);

  function increaseTime() {
    time += 0.1;
  }
  timeinterval = setInterval(increaseTime, 100);
  let data = JSON.stringify({
    data: {
      type: "start",
      game: "game_1",
    },
  });
  sendData(data);
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("video_feed").style.display = "flex";
  document.getElementById("gameScreen").style.display = "flex";

  playing = true;
});
let overlaptimes = {}; //we will use this to pass the time of overlap to the backend

function handleOverlap(event) {
  const plant = document.getElementById(event.detail.plantId);
  if (plant.dataset.watertime >= parseFloat(0)) {
    plant.dataset.watertime = `${parseFloat(plant.dataset.watertime) - 0.1}`;

    if (!overlaptimes[plant.id]) {
      overlaptimes[plant.id] = [];
    }

    overlaptimes[plant.id].push(time);

    let waterTime = parseFloat(plant.dataset.watertime);

    if (waterTime >= 0.75 && waterTime <= 1.0) {
      plant.src = window.static_folder[0.75];
      plant.style;
    } else if (waterTime >= 0.5 && waterTime < 0.75) {
      plant.src = window.static_folder[0.5];
    } else if (waterTime >= 0.25 && waterTime < 0.5) {
      plant.src = window.static_folder[0.25];
    } else if (waterTime >= 0.0 && waterTime < 0.25) {
      plant.src = window.static_folder[0.0];
      plant.dataset.completed = "true";
      overlaptimes[plant.id].push(time + " end");

      let plantIdNumber = plant.id.match(/\d+/)[0]; // Extract the number from the plant id
      let data = JSON.stringify({
        data: {
          type: "plant",
          plant: plantIdNumber,
          time: time,
          overlaps: overlaptimes,
        },
      });
      sendData(data);
    }
  }
  let check = 0;
  plants.forEach((plant) => {
    if (plant.dataset.completed === "true") {
      check++;
    }
  });

  if (check === 5) {
    //This means the game is done. Need to redirect to the next page
    handleGameWin();
  }
}
// Adicionar evento ao botão "Finalizar Jogo"
document.getElementById("endButton").addEventListener("click", () => {
  endGame(); // Finalizar o jogo manualmente
});

function endGame() {
  // Parar o temporizador
  clearInterval(timeinterval);

  // Remover o evento de sobreposição
  wateringcan.removeEventListener("overlap", handleOverlap);

  // Mostrar modal ou mensagem de conclusão
  const myModal = new bootstrap.Modal(document.getElementById("exampleModal"));
  myModal.show();
}

function handleGameWin() {
  if (document.getElementById("startScreen").style.display == "none") {
    const myModal = new bootstrap.Modal(
      document.getElementById("exampleModal")
    );
    myModal.show();
    setTimeout(() => {
      startFireworks(document.getElementById("modal-text"));
      StartConfetti();
    }, 4500);
    clearInterval(timeinterval);
    wateringcan.removeEventListener("overlap", handleOverlap);
    //need to stop the graph from updating
  }
  let data = JSON.stringify({
    data: {
      type: "plant",
      completed: true,
      overlaps: overlaptimes,
    },
  });
  sendData(data);
}
