document.addEventListener("DOMContentLoaded", () => {
  // Elementlar
  const balanceValue = document.getElementById("balance-value");
  const statusElement = document.getElementById("status");
  const timeValue = document.getElementById("time-value");
  const serviceInfo = document.getElementById("service-info");
  const selectedService = document.getElementById("selected-service");
  const serviceButtons = document.querySelectorAll(".service-btn");
  const startButton = document.getElementById("start-btn");
  const pauseButton = document.getElementById("pause-btn");

  // O'zgaruvchilar
  let balance = 1000; // Foydalanuvchi balansi
  let currentService = null;
  let currentRate = 0;
  let timeRemaining = 0;
  let timerInterval = null;
  let status = "Bo'sh";

  // UI yangilash funksiyasi
  const updateUI = () => {
    balanceValue.textContent = Math.round(balance).toLocaleString(); // Yaxlitlangan balans
    timeValue.textContent = formatTime(timeRemaining);
    statusElement.textContent = status;
    statusElement.className = `status ${status.toLowerCase()}`;
    serviceInfo.style.display = currentService ? "block" : "none";
    selectedService.textContent = currentService || "Hech biri";
    serviceButtons.forEach((btn) => {
      btn.disabled = status === "Ishlamoqda";
    });
    startButton.disabled = !currentService || status === "Ishlamoqda";
    pauseButton.disabled = status !== "Ishlamoqda";
  };

  // Vaqtni formatlash funksiyasi
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Xizmatni tanlash
  serviceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (status === "Ishlamoqda") {
        alert("Yangi xizmatni boshlashdan oldin joriy xizmatni to'xtating.");
        return;
      }

      const service = button.getAttribute("data-service");
      const rate = parseInt(button.getAttribute("data-rate"), 10);

      currentService = service;
      currentRate = rate;

      // Foydalanuvchi balansiga qarab maksimal vaqtni hisoblash
      timeRemaining = Math.floor((balance * 60) / currentRate);

      status = "Boshlashga tayyor";
      updateUI();
    });
  });

  // Xizmatni boshlash
  startButton.addEventListener("click", () => {
    if (!currentService) {
      alert("Iltimos, avval xizmatni tanlang.");
      return;
    }

    if (timerInterval) clearInterval(timerInterval);

    status = "Ishlamoqda";
    updateUI();

    timerInterval = setInterval(() => {
      if (timeRemaining > 0 && balance >= currentRate / 60) {
        timeRemaining--;
        balance -= currentRate / 60;
        balance = Math.round(balance); // Balansni yaxlitlash

        // Agar balans 40 so‘mdan kam bo‘lsa, nolga tenglashtirish
        if (balance < 40) {
          balance = 0;
          clearInterval(timerInterval);
          timerInterval = null;
          status = "Bo'sh";
          currentService = null;
          currentRate = 0;
          alert("Balansingiz yetarli emas. Xizmat to'xtatildi.");
        }

        updateUI();
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        status = "Bo'sh";
        currentService = null;
        currentRate = 0;
        updateUI();
        alert("Xizmat vaqti tugadi yoki balans yetarli emas.");
      }
    }, 1000);
  });

  // Xizmatni to'xtatish
  pauseButton.addEventListener("click", () => {
    if (status !== "Ishlamoqda") return;

    clearInterval(timerInterval);
    timerInterval = null;
    status = "To'xtatilgan";
    updateUI();
  });

  // Dastlabki UI holatini o'rnatish
  updateUI();
});
