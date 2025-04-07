document.addEventListener("DOMContentLoaded", () => {
  const balanceEl       = document.getElementById("balance-value");
  const statusEl        = document.getElementById("status");
  const timeEl          = document.getElementById("time-value");
  const svcInfo         = document.getElementById("service-info");
  const svcNameEl       = document.getElementById("selected-service");
  const svcButtons      = document.querySelectorAll(".service-btn");
  const startBtn        = document.getElementById("start-btn");
  const pauseBtn        = document.getElementById("pause-btn");

  let currentService = null;
  let currentRate    = 0;
  let timerInterval  = null;

  function updateUI(state) {
    balanceEl.textContent = Math.round(state.balance);
    timeEl.textContent    = formatTime(state.time_remaining);
    statusEl.textContent  = state.running ? "Ishlamoqda"
                         : (state.service ? "To'xtatilgan" : "Bo'sh");

    svcInfo.style.display = state.service ? "block" : "none";
    svcNameEl.textContent = state.service || "None";

    svcButtons.forEach(btn => btn.disabled = state.running);
    startBtn.disabled = state.running || !currentService;
    pauseBtn.disabled = !state.running;
  }

  function formatTime(sec) {
    const m = Math.floor(sec/60), s = sec % 60;
    return `${m}:${s.toString().padStart(2,"0")}`;
  }

  async function fetchStatus() {
    const resp = await fetch("/api/status");
    return resp.json();
  }

  // Poll the server every second to refresh state
  function startPolling() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(async () => {
      const st = await fetchStatus();
      updateUI(st);
    }, 1000);
  }

  svcButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      currentService = btn.dataset.service;
      currentRate    = +btn.dataset.rate;
      startBtn.disabled = false;
      svcInfo.style.display = "block";
      svcNameEl.textContent = currentService;
    });
  });

  startBtn.addEventListener("click", async () => {
    if (!currentService) return alert("Select a service first.");

    const resp = await fetch("/api/start", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        service: currentService,
        rate: currentRate
      })
    });
    const st = await resp.json();
    updateUI(st);
    startPolling();
  });

  pauseBtn.addEventListener("click", async () => {
    const resp = await fetch("/api/pause", { method: "POST" });
    const st = await resp.json();
    clearInterval(timerInterval);
    updateUI(st);
  });

  // initial load
  fetchStatus().then(st => updateUI(st));
});
