async function getGoldPrice24K() {
  try {
    const response = await fetch("https://www.goldapi.io/api/XAU/JOD", {
      method: "GET",
      headers: {
        "x-access-token": "goldapi-jafnpsmbvuy5fg-io",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const pricePerOunce = data.price;
    const gramsInOunce = 31.1035;
    const pricePerGram24 = pricePerOunce / gramsInOunce;

    return pricePerGram24; // القيمة كعدد (دينار لكل غرام عيار 24)
  } catch (error) {
    console.error("Error fetching gold price:", error);
    throw error; // إعادة رمي الخطأ ليتعامل معه المستدعي
  }
}

const goldArr = [];
const gp = getGoldPrice24K().then((data) => goldArr.push(data));

const CONSTANTS = {
  ZAKAT: {
    GOLD_PRICE: 70, // JOD per gram
    SILVER_PRICE: 1, // JOD per gram
    NISAB: 612, // JOD
    ZAKAT_RATE: 0.025, // 2.5%
  },
  CHART: {
    COLORS: [
      getComputedStyle(document.documentElement)
        .getPropertyValue("--primary-color")
        .trim(),
      getComputedStyle(document.documentElement)
        .getPropertyValue("--secondary-color")
        .trim(),
      "#3B6978",
      "#204051",
    ],
    FONT_FAMILY: "Tajawal, Arial",
    TITLE_FONT: "Amiri, Arial",
  },
};

let currentStep = 1;
let currentChartType = { mirath: "pie", zakat: "pie" };
let currentCarouselIndex = 0;

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

async function loadChartLibraries() {
  if (window.Chart && window.ChartDataLabels) {
    console.log("Chart.js and ChartDataLabels already loaded");
    return true;
  }
  console.log("Attempting to load Chart.js and ChartDataLabels locally");
  try {
    const scripts = [
      { id: "chartjs", src: "assets/chart.min.js", name: "Chart.js" },
      {
        id: "chartjs-datalabels",
        src: "assets/chartjs-plugin-datalabels.min.js",
        name: "ChartDataLabels",
      },
    ];
    for (const script of scripts) {
      if (!document.getElementById(script.id)) {
        console.log(`Loading ${script.src}`);
        await new Promise((resolve, reject) => {
          const element = document.createElement("script");
          element.id = script.id;
          element.src = script.src;
          element.async = false;
          element.onload = () => {
            console.log(`${script.name} loaded successfully`);
            resolve();
          };
          element.onerror = () => {
            console.error(`Failed to load ${script.src}`);
            reject(
              new Error(`Failed to load ${script.name} from ${script.src}`)
            );
          };
          document.head.appendChild(element);
        });
      }
    }
    return true;
  } catch (error) {
    console.error("Error loading chart libraries:", error.message);
    return false;
  }
}

async function loadPDLibraries() {
  if (window.html2canvas && window.jspdf) {
    console.log("html2canvas and jsPDF already loaded");
    return true;
  }
  console.log("Attempting to load html2canvas and jsPDF locally");
  try {
    const scripts = [
      {
        id: "html2canvas",
        src: "assets/html2canvas.min.js",
        name: "html2canvas",
      },
      { id: "jspdf", src: "assets/jspdf.umd.min.js", name: "jsPDF" },
    ];
    for (const script of scripts) {
      if (!document.getElementById(script.id)) {
        console.log(`Loading ${script.src}`);
        await new Promise((resolve, reject) => {
          const element = document.createElement("script");
          element.id = script.id;
          element.src = script.src;
          element.async = false;
          element.onload = () => {
            console.log(`${script.name} loaded successfully`);
            resolve();
          };
          element.onerror = () => {
            console.error(`Failed to load ${script.src}`);
            reject(
              new Error(`Failed to load ${script.name} from ${script.src}`)
            );
          };
          document.head.appendChild(element);
        });
      }
    }
    return true;
  } catch (error) {
    console.error("Error loading PDF libraries:", error.message);
    return false;
  }
}

function myInherit() {
  const wife = document.querySelector("#wive");
}

function toggleHusbandField() {
  const gender = document.getElementById("deceased-gender").value;
  const husbandField = document.getElementById("husband-field");
  husbandField.style.display = gender === "female" ? "block" : "none";
  document.getElementById("wives").disabled = gender === "female";
  if (gender === "female") document.getElementById("wives").value = "0";
}

function validateInput(fieldId, errorId, message, condition) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(errorId);
  const value = input.value ? parseFloat(input.value) : null;
  if (condition(value)) {
    error.textContent = message;
    error.classList.add("show");
    input.classList.add("error");
    return false;
  } else {
    error.textContent = "";
    error.classList.remove("show");
    input.classList.remove("error");
    return true;
  }
}

function validateBequests() {
  const estateValue =
    parseFloat(document.getElementById("estateValue").value) || 0;
  const debts = parseFloat(document.getElementById("debts").value) || 0;
  const bequests = parseFloat(document.getElementById("bequests").value) || 0;
  const netEstate = estateValue - debts;
  const maxBequests = netEstate / 3;
  const error = document.getElementById("bequests-error");
  if (netEstate < 0) {
    error.textContent = "التركة سلبية بعد الديون، لا يمكن إدخال وصايا.";
    error.classList.add("show");
    return false;
  } else if (bequests > maxBequests && netEstate > 0) {
    error.textContent = `الوصايا لا يمكن أن تتجاوز ثلث التركة (${maxBequests.toFixed(
      2
    )} دينار).`;
    error.classList.add("show");
    return false;
  } else {
    error.textContent = "";
    error.classList.remove("show");
    return true;
  }
}

function validateCurrentStep(step) {
  if (step === "1") {
    return (
      validateInput(
        "estateValue",
        "estateValue-error",
        "يرجى إدخال قيمة التركة.",
        (value) => !value || value < 0
      ) &&
      validateInput(
        "debts",
        "debts-error",
        "يرجى إدخال قيمة غير سالبة.",
        (value) => value < 0
      ) &&
      validateInput(
        "bequests",
        "bequests-error",
        "يرجى إدخال قيمة غير سالبة.",
        (value) => value < 0
      ) &&
      validateBequests()
    );
  } else if (step === "2") {
    return true;
  } else if (step === "3") {
    const gender = document.getElementById("deceased-gender").value;
    return validateInput(
      "wives",
      "wives-error",
      gender === "female"
        ? "لا يمكن إدخال زوجات لمتوفاة أنثى."
        : "يرجى إدخال عدد غير سالب.",
      (value) => (gender === "female" && value > 0) || value < 0
    );
  }
  return true;
}

function setupValidation() {
  [
    "estateValue",
    "debts",
    "bequests",
    "wives",
    "sons",
    "daughters",
    "cash",
    "gold",
    "silver",
    "investments",
    "zakat-debts",
  ].forEach((field) => {
    const input = document.getElementById(field);
    if (input) {
      input.addEventListener(
        "input",
        debounce(() => {
          if (
            field === "estateValue" ||
            field === "debts" ||
            field === "bequests"
          ) {
            validateBequests();
          }
          validateCurrentStep(
            document.querySelector(".form-section.active").dataset.step
          );
        }, 300)
      );
    }
  });
}

function scrollToCalculator() {
  document.getElementById("calculator").scrollIntoView({ behavior: "smooth" });
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
  document.querySelector(".main-content").classList.toggle("sidebar-active");
}

function setTheme(theme) {
  document.body.classList.remove("light", "dark", "islamic");
  document.body.classList.add(theme);
  localStorage.setItem("theme", theme);
}

function switchSection(section) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".section-tabs .tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".sidebar nav a")
    .forEach((a) => a.classList.remove("active"));

  document.getElementById(`${section}-section`).classList.add("active");
  document
    .querySelector(`.section-tabs .tab[onclick="switchSection('${section}')"]`)
    .classList.add("active");
  document
    .querySelector(`.sidebar nav a[onclick="switchSection('${section}')"]`)
    .classList.add("active");

  document
    .querySelector(`.section-tabs .tab[onclick="switchSection('${section}')"]`)
    .setAttribute("aria-selected", "true");
  document
    .querySelector(`.section-tabs .tab[onclick="switchSection('mirath')"]`)
    .setAttribute("aria-selected", section === "mirath" ? "true" : "false");
  document
    .querySelector(`.section-tabs .tab[onclick="switchSection('zakat')"]`)
    .setAttribute("aria-selected", section === "zakat" ? "true" : "false");
}

function showOnboarding() {
  document.getElementById("onboarding-modal").classList.add("active");
  currentCarouselIndex = 0;
  updateCarousel();
}

function closeOnboarding() {
  document.getElementById("onboarding-modal").classList.remove("active");
  localStorage.setItem("onboardingSeen", "true");
}

function changeCarousel(direction) {
  const items = document.querySelectorAll(".carousel-item");
  currentCarouselIndex =
    (currentCarouselIndex + direction + items.length) % items.length;
  updateCarousel();
}

function updateCarousel() {
  const items = document.querySelectorAll(".carousel-item");
  items.forEach((item, index) => {
    item.classList.toggle("active", index === currentCarouselIndex);
  });
}

function navigateStep(direction) {
  const newStep = currentStep + direction;
  if (newStep < 1 || newStep > 3) return;
  if (direction > 0 && !validateCurrentStep(currentStep.toString())) {
    alert("يرجى تصحيح الأخطاء قبل التقدم.");
    return;
  }
  showSection(newStep);
  currentStep = newStep;
  document.getElementById("prev-step").disabled = currentStep === 1;
  document.getElementById("next-step").disabled = currentStep === 3;
}

function showSection(step) {
  document
    .querySelectorAll(".form-section")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".step")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelector(`.form-section[data-step="${step}"]`)
    .classList.add("active");
  document.querySelector(`.step[data-step="${step}"]`).classList.add("active");
}

function shareOnWhatsApp(section) {
  const text =
    document.getElementById(`${section}-results-text`).innerText ||
    (section === "mirath"
      ? "جرب حاسبة المواريث الإسلامية"
      : "جرب حاسبة الزكاة الإسلامية");
  window.open(
    `https://api.whatsapp.com/send?text=${encodeURIComponent(
      text + ": " + window.location.href
    )}`,
    "_blank"
  );
}

function shareOnTwitter(section) {
  const text =
    document.getElementById(`${section}-results-text`).innerText ||
    (section === "mirath"
      ? "حاسبة المواريث الإسلامية - احسب توزيع التركة بسهولة!"
      : "حاسبة الزكاة الإسلامية - احسب زكاتك بسهولة!");
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text + " " + window.location.href
    )}`,
    "_blank"
  );
}

function handleChartToggleKeypress(event, type, section) {
  if (event.key === "Enter" || event.key === " ") {
    toggleChart(type, section);
  }
}

function toggleChart(type, section) {
  currentChartType[section] = type;
  document
    .querySelectorAll(`#${section}-results .chart-toggle button`)
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelector(
      `#${section}-results .chart-toggle button[onclick="toggleChart('${type}', '${section}')"]`
    )
    .classList.add("active");
  section === "mirath" ? calculateInheritance() : calculateZakat();
}

function createChartConfig(section, chartData, type) {
  return {
    type,
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { family: CONSTANTS.CHART.FONT_FAMILY, size: 14 },
            color: document.body.classList.contains("dark")
              ? "#E0E0E0"
              : "#2D2D2D",
            padding: 15,
          },
        },
        title: {
          display: true,
          text: section === "mirath" ? "توزيع المواريث" : "توزيع الزكاة",
          font: { family: CONSTANTS.CHART.TITLE_FONT, size: 18 },
          color: document.body.classList.contains("dark")
            ? "#FFFFFF"
            : "#1A3C34",
          padding: { top: 10, bottom: 15 },
        },
        datalabels: {
          color: "#FFFFFF",
          font: { family: CONSTANTS.CHART.FONT_FAMILY, size: 12 },
          formatter: (value, ctx) => {
            const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
            return ((value / sum) * 100).toFixed(1) + "%";
          },
          anchor: "center",
          align: "center",
        },
        tooltip: {
          backgroundColor: document.body.classList.contains("dark")
            ? "#204051"
            : "#FFFFFF",
          titleFont: { family: CONSTANTS.CHART.TITLE_FONT, size: 14 },
          bodyFont: { family: CONSTANTS.CHART.FONT_FAMILY, size: 12 },
          callbacks: {
            label: (context) => {
              const label = context.label || "";
              const value = context.parsed || 0;
              const sum = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / sum) * 100).toFixed(1);
              return `${label}: ${value.toFixed(2)} دينار (${percentage}%)`;
            },
          },
        },
      },
      animation: {
        animateScale: true,
        animateRotate: type === "pie",
        duration: 400,
        easing: "easeOutQuad",
      },
      elements: {
        arc: { borderWidth: 1 },
        bar: { borderWidth: 1, borderRadius: 4 },
      },
      layout: { padding: 10 },
      scales:
        type === "bar"
          ? {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "المبلغ (دينار)",
                  font: { family: CONSTANTS.CHART.FONT_FAMILY, size: 14 },
                  color: document.body.classList.contains("dark")
                    ? "#E0E0E0"
                    : "#2D2D2D",
                },
                ticks: {
                  font: { family: CONSTANTS.CHART.FONT_FAMILY, size: 12 },
                  color: document.body.classList.contains("dark")
                    ? "#E0E0E0"
                    : "#2D2D2D",
                },
                grid: {
                  color: document.body.classList.contains("dark")
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                },
              },
              x: {
                ticks: {
                  font: { family: CONSTANTS.CHART.FONT_FAMILY, size: 12 },
                  color: document.body.classList.contains("dark")
                    ? "#E0E0E0"
                    : "#2D2D2D",
                  maxRotation: 45,
                  minRotation: 45,
                },
                grid: { display: false },
              },
            }
          : {},
    },
  };
}

function addAccessibleChartTable(section, chartData) {
  const table = document.getElementById(`${section}-accessible-table`);
  const sum = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
  table.innerHTML = `
    <caption>بيانات مخطط ${
      section === "mirath" ? "المواريث" : "الزكاة"
    } للقراء الشاشيين</caption>
    <thead><tr><th scope="col">الفئة</th><th scope="col">المبلغ (دينار)</th><th scope="col">النسبة (%)</th></tr></thead>
    <tbody>
      ${chartData.labels
        .map(
          (label, i) => `
        <tr>
          <td>${label}</td>
          <td>${chartData.datasets[0].data[i].toFixed(2)}</td>
          <td>${((chartData.datasets[0].data[i] / sum) * 100).toFixed(1)}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  `;
}

async function downloadChartsAsPDF(section) {
  try {
    // Load PDF libraries
    if (!window.html2canvas || !window.jspdf) {
      console.log(
        "html2canvas or jsPDF not loaded, attempting to load locally"
      );
      const loaded = await loadPDLibraries();
      if (!loaded || !window.html2canvas || !window.jspdf) {
        alert(
          "فشل تحميل مكتبات PDF. تأكد من وجود assets/html2canvas.min.js و assets/jspdf.umd.min.js."
        );
        return;
      }
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
    });

    const canvas = document.getElementById(`${section}-sharesChart`);
    if (!canvas || !canvas.getContext("2d")) {
      alert("يرجى إنشاء المخطط أولاً عن طريق إجراء الحساب.");
      return;
    }

    // Ensure canvas is visible
    const originalDisplay = canvas.style.display;
    const originalVisibility = canvas.style.visibility;
    canvas.style.display = "block";
    canvas.style.visibility = "visible";

    // Wait for chart to render fully
    const waitForChartUpdate = () =>
      new Promise((resolve) => setTimeout(resolve, 2000));
    const chart = window[section === "mirath" ? "mirathChart" : "zakatChart"];
    const originalAnimation = chart ? chart.options.animation : null;
    if (chart) {
      chart.options.animation = { duration: 0 }; // Disable animation
    }

    // Capture pie chart
    currentChartType[section] = "pie";
    section === "mirath"
      ? await calculateInheritance()
      : await calculateZakat();
    await waitForChartUpdate();
    const pieCanvas = await html2canvas(canvas, {
      scale: 3, // Balanced quality and file size
      backgroundColor: document.body.classList.contains("dark")
        ? "#0A1C2B"
        : "#F8F1E9",
      useCORS: true,
      logging: true,
    });
    const pieImg = pieCanvas.toDataURL("image/png", 1.0);
    if (!pieImg.includes("data:image/png")) {
      throw new Error("Pie chart capture failed: Invalid image data");
    }
    console.log("Pie chart captured successfully");

    // Capture bar chart
    currentChartType[section] = "bar";
    section === "mirath"
      ? await calculateInheritance()
      : await calculateZakat();
    await waitForChartUpdate();
    const barCanvas = await html2canvas(canvas, {
      scale: 3,
      backgroundColor: document.body.classList.contains("dark")
        ? "#0A1C2B"
        : "#F8F1E9",
      useCORS: true,
      logging: true,
    });
    const barImg = barCanvas.toDataURL("image/png", 1.0);
    if (!barImg.includes("data:image/png")) {
      throw new Error("Bar chart capture failed: Invalid image data");
    }
    console.log("Bar chart captured successfully");

    // Restore chart animation and canvas styles
    if (chart) {
      chart.options.animation = originalAnimation;
      chart.update();
    }
    canvas.style.display = originalDisplay;
    canvas.style.visibility = originalVisibility;

    // PDF layout
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 15;
    const chartWidth = (pageWidth - 3 * margin) / 2;
    const chartHeight = 100;

    // Add charts with borders
    pdf.rect(margin, margin, chartWidth, chartHeight, "S"); // Border for pie chart
    pdf.addImage(
      pieImg,
      "PNG",
      margin,
      margin,
      chartWidth,
      chartHeight,
      "",
      "FAST"
    );

    pdf.rect(
      margin + chartWidth + margin,
      margin,
      chartWidth,
      chartHeight,
      "S"
    ); // Border for bar chart
    pdf.addImage(
      barImg,
      "PNG",
      margin + chartWidth + margin,
      margin,
      chartWidth,
      chartHeight,
      "",
      "FAST"
    );

    // Save PDF
    pdf.save(`${section}-charts.pdf`);
    console.log("PDF generated successfully with charts");
  } catch (error) {
    console.error("خطأ في إنشاء PDF:", error.message, error.stack);
    alert(
      "خطأ في إنشاء PDF: فشل تحميل المخططات. تحقق من وحدة التحكم للحصول على التفاصيل."
    );
  }
}

function saveCalculation(section) {
  const formId = section === "mirath" ? "inheritance-form" : "zakat-form";
  const inputs = {};
  document
    .querySelectorAll(`#${formId} input, #${formId} select`)
    .forEach((input) => {
      inputs[input.id] = input.value;
    });
  inputs.results = document.getElementById(`${section}-results-text`).innerText;
  const storageKey =
    section === "mirath" ? "savedMirathCalculations" : "savedZakatCalculations";
  const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
  saved.push({ timestamp: new Date().toISOString(), data: inputs });
  localStorage.setItem(storageKey, JSON.stringify(saved));
  alert("تم حفظ الحساب!");
  updateSavedCalculationsDropdown(section);
}

function loadCalculation(timestamp, section) {
  const storageKey =
    section === "mirath" ? "savedMirathCalculations" : "savedZakatCalculations";
  const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
  const calc = saved.find((c) => c.timestamp === timestamp);
  if (calc) {
    Object.keys(calc.data).forEach((key) => {
      if (key !== "results") {
        const element = document.getElementById(key);
        if (element) element.value = calc.data[key];
      }
    });
    if (section === "mirath") {
      toggleHusbandField();
      calculateInheritance();
    } else {
      calculateZakat();
    }
  }
}

function updateSavedCalculationsDropdown(section) {
  const select = document.querySelector(
    `#${section}-results .results-actions select`
  );
  select.innerHTML = '<option value="">اختر حساباً محفوظاً</option>';
  const storageKey =
    section === "mirath" ? "savedMirathCalculations" : "savedZakatCalculations";
  const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
  saved.forEach((c) => {
    const option = document.createElement("option");
    option.value = c.timestamp;
    option.textContent = new Date(c.timestamp).toLocaleString("ar-EG");
    select.appendChild(option);
  });
}

function resetForm(section) {
  const formId = section === "mirath" ? "inheritance-form" : "zakat-form";
  document.getElementById(formId).reset();
  document.getElementById(`${section}-results-text`).innerText = "";
  document.getElementById(`${section}-details-content`).innerHTML = "";
  document.getElementById(`${section}-results`).classList.remove("show");
  document.getElementById(`${section}-accessible-table`).innerHTML = "";
  if (window[section === "mirath" ? "mirathChart" : "zakatChart"]) {
    window[section === "mirath" ? "mirathChart" : "zakatChart"].destroy();
    window[section === "mirath" ? "mirathChart" : "zakatChart"] = null;
  }
  document.getElementById(`${section}-sharesChart`).style.display = "none";
  document
    .querySelectorAll(`#${formId} .error-message`)
    .forEach((e) => e.classList.remove("show"));
  document
    .querySelectorAll(`#${formId} .error`)
    .forEach((e) => e.classList.remove("error"));
  if (section === "mirath") {
    toggleHusbandField();
    showSection(1);
    currentStep = 1;
    document.getElementById("prev-step").disabled = true;
    document.getElementById("next-step").disabled = false;
  }
}

async function calculateInheritance() {
  if (!validateCurrentStep("1") || !validateCurrentStep("3")) {
    alert("يرجى تصحيح الأخطاء في النموذج قبل الحساب.");
    return;
  }
  const estateValueOp =
    parseFloat(document.getElementById("estateValueOp").value) || 0;
  let estateValue =
    parseFloat(document.getElementById("estateValue").value) || 0;
  estateValue += estateValueOp;
  const debts = parseFloat(document.getElementById("debts").value) || 0;

  const bequests = parseFloat(document.getElementById("bequests").value) || 0;
  const gender = document.getElementById("deceased-gender").value;

  /* ************* */
  const partner = document.getElementById(
    gender === "male" ? "wives" : "husband"
  );
  console.log(partner);
  const son = document.getElementById("sons");
  console.log("sons are: " + son.value);
  const daughter = document.getElementById("daughters");
  const fath = document.getElementById("father");
  const moth = document.getElementById("mother");

  const pGrandFather = document.getElementById("pGrandFather");
  const pGrandMother = document.getElementById("pGrandMother");

  const grandSon = document.getElementById("grandSon");
  const grandDaughter = document.getElementById("grandDaughter");
  const fSiblingsBrothers = document.getElementById("fSiblingsBrother");
  const fSiblingsSisters = document.getElementById("fSiblingsSister");
  const pSiblingsBrothers = document.getElementById("pSiblingsBrother");
  const pSiblingsSisters = document.getElementById("pSiblingsSister");
  const mSiblings = document.getElementById("mSiblings");

  function convertStringToNumber(heir) {
    const isExist = heir.value == "yes" ? 1 : 0;
    return isExist;
  }
  function mapHiers(heirs) {
    const map = new Map();
    for (let i = 0; i < heirs.length; i++) {
      if (heirs[i].value) {
        console.log("heir is: " + heirs[i].name);
        // cheack if value is string  (' And Deffrentiate between "0" and "yes" ')
        let isStr = Number(heirs[i].value).toString() == "NaN";
        map.set(
          heirs[i].parentElement.dataset.type,
          isStr ? convertStringToNumber(heirs[i]) : Number(heirs[i].value)
        );
      }
    }
    console.log("mapped Values are: ", map);

    return map;
  }
  console.log(pGrandFather);
  const mappedHeirs = mapHiers([
    son,
    daughter,
    fath,
    moth,
    partner,
    grandSon,
    grandDaughter,
    fSiblingsBrothers,
    fSiblingsSisters,
    pSiblingsBrothers,
    pSiblingsSisters,
    mSiblings,
    pGrandFather,
    pGrandMother,
  ]);

  // remove heirs from map if thier value 0 (becouse he/she not exists) .
  function removeHeirs(map) {
    const keys = [...map.keys()];
    for (let i = 0; i < keys.length; i++) {
      console.log(keys[i]);

      if (!map.get(keys[i])) {
        console.log(keys[i]);
        map.delete(keys[i]);
      }
    }
    return map;
  }
  let netEstate = estateValue - debts - bequests;
  const sanitizeMap = removeHeirs(mappedHeirs);
  console.log(sanitizeMap);
  const re = calculateInher(sanitizeMap, netEstate);
  const judges = [];
  for (let i = 0; i < re.length; i++) {
    judges.push(re[i].judge);
  }
  console.log(judges);
  /*   *************  */
  if (!estateValue) {
    validateInput(
      "estateValue",
      "estateValue-error",
      "يرجى إدخال قيمة التركة.",
      () => true
    );
    return;
  }

  if (netEstate < 0) {
    document.getElementById("mirath-results-text").innerText =
      "التركة سلبية بعد خصم الديون والوصايا.";
    document.getElementById("mirath-results").classList.add("show");
    document.getElementById("mirath-sharesChart").style.display = "none";
    document.getElementById("mirath-results-table").style.display = "none";
    return;
  }

  let totalFixedShares = 0;
  const shares = re;
  const details = judges;

  if (!shares.length) {
    document.getElementById("mirath-results-text").innerText =
      "لا يوجد ورثة محددون.";
    document.getElementById("mirath-results").classList.add("show");
    document.getElementById("mirath-sharesChart").style.display = "none";
    document.getElementById("mirath-results-table").style.display = "none";
    return;
  }
  const totalShare = shares.reduce((sum, s) => sum + s.share, 0);
  const resultsText =
    `صافي التركة بعد الديون والوصايا: ${netEstate.toFixed(2)} دينار\n\n\n\n` +
    shares
      .map(
        (s) =>
          `${s.heir} (${s.count}): ${s.share.toFixed(2)} دينار (${(
            (s.share / netEstate) *
            100
          ).toFixed(1)}%)` + `\n ${s.judge}`
      )
      .join("\n\n");
  document.getElementById("mirath-results-text").innerText = resultsText;

  const table = document.getElementById("mirath-results-table");
  table.innerHTML = `
    <caption>توزيع التركة حسب الشريعة الإسلامية</caption>
    <thead>
      <tr>
        <th scope="col">الوريث</th>
        <th scope="col">العدد</th>
        <th scope="col">الحصة (دينار)</th>
        <th scope="col">النسبة (%)</th>
      </tr>
    </thead>
    <tbody>
      ${shares
        .map(
          (s) => `
        <tr>
          <td>${s.heir}</td>
          <td>${s.count}</td>
          <td>${s.share.toFixed(2)}</td>
          <td>${((s.share / netEstate) * 100).toFixed(1)}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2">الإجمالي</td>
        <td>${totalShare.toFixed(2)}</td>
        <td>${((totalShare / netEstate) * 100).toFixed(1)}</td>
      </tr>
    </tfoot>
  `;
  table.style.display = "table";

  document.getElementById("mirath-details-content").innerHTML = details
    .map((d) => `<p>${d}</p>`)
    .join("");
  document.getElementById("mirath-results").classList.add("show");
  console.log("Here ----------- " + shares.map((s) => s.heir));
  const chartData = {
    labels: shares.map((s) => s.heir),
    datasets: [
      {
        data: shares.map((s) => s.share),
        backgroundColor: CONSTANTS.CHART.COLORS,
        borderColor: CONSTANTS.CHART.COLORS,
        borderWidth: 1,
      },
    ],
  };

  const chartLoaded = await loadChartLibraries();
  if (!chartLoaded || !window.Chart || !window.ChartDataLabels) {
    console.error("Chart.js or ChartDataLabels not loaded.");
    document.getElementById("mirath-sharesChart").style.display = "none";
    alert("فشل تحميل مكتبة المخططات. سيتم عرض النتائج كنصوص فقط.");
    return;
  }

  const ctx = document.getElementById("mirath-sharesChart").getContext("2d");
  if (window.mirathChart) {
    window.mirathChart.data = chartData;
    window.mirathChart.config.type = currentChartType.mirath;
    window.mirathChart.update();
  } else {
    Chart.register(ChartDataLabels);
    window.mirathChart = new Chart(
      ctx,
      createChartConfig("mirath", chartData, currentChartType.mirath)
    );
  }

  addAccessibleChartTable("mirath", chartData);
  document.getElementById("mirath-sharesChart").style.display = "block";
  document
    .getElementById("mirath-sharesChart")
    .setAttribute("aria-label", "مخطط توزيع المواريث");
}

async function calculateZakat() {
  const cash = parseFloat(document.getElementById("cash").value) || 0;
  const gold = parseFloat(document.getElementById("gold").value) || 0;
  const silver = parseFloat(document.getElementById("silver").value) || 0;
  const investments =
    parseFloat(document.getElementById("investments").value) || 0;
  const debts = parseFloat(document.getElementById("zakat-debts").value) || 0;
  ["cash", "gold", "silver", "investments", "zakat-debts"].forEach((field) => {
    validateInput(
      field,
      `${field}-error`,
      "يرجى إدخال قيمة غير سالبة.",
      (value) => value < 0
    );
  });

  const goldValue = goldArr[0] ? gold * goldArr[0].toFixed(2) : gold * 70;
  const silverValue = silver * CONSTANTS.ZAKAT.SILVER_PRICE;
  const totalWealth = cash + goldValue + silverValue + investments - debts;

  if (totalWealth < 0) {
    document.getElementById("zakat-results-text").innerText =
      "صافي الثروة سلبي بعد خصم الديون.";
    document.getElementById("zakat-results").classList.add("show");
    document.getElementById("zakat-sharesChart").style.display = "none";
    document.getElementById("zakat-results-table").style.display = "none";
    return;
  }

  let zakatDue = 0;
  if (totalWealth >= CONSTANTS.ZAKAT.NISAB) {
    zakatDue = totalWealth * CONSTANTS.ZAKAT.ZAKAT_RATE;
  }

  const resultsText =
    `إجمالي الثروة: ${totalWealth.toFixed(2)} دينار\n` +
    `الزكاة المستحقة: ${zakatDue.toFixed(2)} دينار\n` +
    `الثروة المتبقية: ${(totalWealth - zakatDue).toFixed(2)} دينار`;
  document.getElementById("zakat-results-text").innerText = resultsText;

  const table = document.getElementById("zakat-results-table");
  table.innerHTML = `
    <caption>تفاصيل حساب الزكاة</caption>
    <thead>
      <tr>
        <th scope="col">البند</th>
        <th scope="col">المبلغ (دينار)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>النقد</td><td>${cash.toFixed(2)}</td></tr>
      <tr><td>الذهب</td><td>${goldValue.toFixed(2)}</td></tr>
      <tr><td>الفضة</td><td>${silverValue.toFixed(2)}</td></tr>
      <tr><td>الاستثمارات</td><td>${investments.toFixed(2)}</td></tr>
      <tr><td>الديون</td><td>${debts.toFixed(2)}</td></tr>
    </tbody>
    <tfoot>
      <tr><td>إجمالي الثروة</td><td>${totalWealth.toFixed(2)}</td></tr>
      <tr><td>الزكاة المستحقة</td><td>${zakatDue.toFixed(2)}</td></tr>
    </tfoot>
  `;
  table.style.display = "table";

  const details = [
    `سعر الذهب: ${CONSTANTS.ZAKAT.GOLD_PRICE} دينار/غرام`,
    `سعر الفضة: ${CONSTANTS.ZAKAT.SILVER_PRICE} دينار/غرام`,
    `النصاب: ${CONSTANTS.ZAKAT.NISAB} دينار`,
    `نسبة الزكاة: ${CONSTANTS.ZAKAT.ZAKAT_RATE * 100}%`,
  ];
  document.getElementById("zakat-details-content").innerHTML = details
    .map((d) => `<p>${d}</p>`)
    .join("");
  document.getElementById("zakat-results").classList.add("show");

  const chartData = {
    labels: ["الزكاة المستحقة", "الثروة المتبقية"],
    datasets: [
      {
        data: zakatDue > 0 ? [zakatDue, totalWealth - zakatDue] : [totalWealth],
        backgroundColor: CONSTANTS.CHART.COLORS,
        borderColor: CONSTANTS.CHART.COLORS,
        borderWidth: 1,
      },
    ],
  };

  const chartLoaded = await loadChartLibraries();
  if (!chartLoaded || !window.Chart || !window.ChartDataLabels) {
    console.error("Chart.js or ChartDataLabels not loaded.");
    document.getElementById("zakat-sharesChart").style.display = "none";
    alert("فشل تحميل مكتبة المخططات. سيتم عرض النتائج كنصوص فقط.");
    return;
  }

  const ctx = document.getElementById("zakat-sharesChart").getContext("2d");
  if (window.zakatChart) {
    window.zakatChart.data = chartData;
    window.zakatChart.config.type = currentChartType.zakat;
    window.zakatChart.update();
  } else {
    Chart.register(ChartDataLabels);
    window.zakatChart = new Chart(
      ctx,
      createChartConfig("zakat", chartData, currentChartType.zakat)
    );
  }

  addAccessibleChartTable("zakat", chartData);
  document.getElementById("zakat-sharesChart").style.display = "block";
  document
    .getElementById("zakat-sharesChart")
    .setAttribute("aria-label", "مخطط توزيع الزكاة");
}

async function submitFeedback() {
  const name = document.getElementById("feedback-name").value;
  const email = document.getElementById("feedback-email").value;
  const message = document.getElementById("feedback-message").value;

  if (!name || !email || !message) {
    alert("يرجى ملء جميع الحقول.");
    return;
  }

  // Mock alert for testing (replace with Formspree ID for production)
  alert(
    `Feedback submitted (mock): Name: ${name}, Email: ${email}, Message: ${message}`
  );
  document.getElementById("feedback-form").reset();
  return;

  // Uncomment for production with Formspree
  /*
  try {
    const response = await fetch("https://formspree.io/f/your_form_id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message })
    });

    if (response.ok) {
      alert("تم إرسال ملاحظاتك بنجاح!");
      document.getElementById("feedback-form").reset();
    } else {
      alert("حدث خطأ أثناء إرسال الملاحظات. حاول مرة أخرى.");
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    alert("حدث خطأ أثناء إرسال الملاحظات. تحقق من الاتصال بالإنترنت.");
  }
  */
}

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "islamic";
  setTheme(savedTheme);

  if (!localStorage.getItem("onboardingSeen")) {
    showOnboarding();
  }

  setupValidation();
  toggleHusbandField();

  document.querySelectorAll(".step").forEach((step) => {
    step.addEventListener("click", () => {
      const stepNumber = parseInt(step.dataset.step);
      if (validateCurrentStep(currentStep.toString())) {
        showSection(stepNumber);
        currentStep = stepNumber;
        document.getElementById("prev-step").disabled = currentStep === 1;
        document.getElementById("next-step").disabled = currentStep === 3;
      }
    });
    step.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const stepNumber = parseInt(step.dataset.step);
        if (validateCurrentStep(currentStep.toString())) {
          showSection(stepNumber);
          currentStep = stepNumber;
          document.getElementById("prev-step").disabled = currentStep === 1;
          document.getElementById("next-step").disabled = currentStep === 3;
        }
      }
    });
  });

  updateSavedCalculationsDropdown("mirath");
  updateSavedCalculationsDropdown("zakat");
  document.getElementById("prev-step").disabled = true;
});
function calculateInher(heirsMap, estate) {
  const heirs = {
    son: {
      name: "son",
      nameAr: "الابن",
      excludedBy: [],
      inheritType1: "agnationWSShareList",
      effectTypeList: ["daughter"],
      inheritType2: "agnationWOShareList",
      effectShareList: [],
      share1: 0,
      share2: 0,
      number: 0,
      judge:
        "المادة 274 - الابن: يرث بالتعصيب إذا انفرد أخذ التركة كلها، وإذا كان معه بنت فللذكر مثل حظ الأنثيين.",
    },
    daughter: {
      name: "daughter",
      nameAr: "البنت",
      excludedBy: [],
      inheritType1: "fixed",
      effectTypeList: ["son"],
      inheritType2: "agnationWOShareList",
      effectShareList: [],
      share1: 1 / 2,
      share2: 2 / 3,
      number: 0,
      judge:
        "المادة 279 - البنت: ترث البنت الواحدة النصف فرضًا إذا لم يوجد معها ابن، وترث البنتان فأكثر الثلثين يُقسم بينهن بالسوية إذا لم يوجد معهن ابن، وتُرث تعصيبًا مع الغير إذا وُجد معها ابن (فللذكر مثل حظ الأنثيين)،  .", // this function for heris with fixed share .
    },
    grandSon: {
      name: "grandSon",
      nameAr: "ابن الابن",

      excludedBy: ["son"],
      inheritType1: "agnationWSShareList",
      effectTypeList: ["grandDaughter"],
      inheritType2: "agnationWOShareList",
      effectShareList: [],
      share1: 0,
      share2: 0,
      number: 0,
      judge:
        "المادة 280 - ابن الابن: يرث بالتعصيب إذا لم يكن للميت ابن، ويُحجب بالابن الأقرب منه درجة.",
    },
    // must check number of daughters to be excluded
    grandDaughter: {
      name: "grandDaughter",
      nameAr: "بنت الابن",

      excludedBy: ["son"],
      inheritType1: "fixed",
      effectTypeList: ["grandSon"],
      inheritType2: "agnationWOShareList",
      effectShareList: ["daughter"],
      share1: 1 / 2,
      share2: 2 / 3,
      share3: 1 / 6,
      number: 0,
      judge:
        "المادة (279) من القانون: ترث بنت الابن إذا انفردت النصف، وإذا كانت بنت الصلب واحدة فلها النصف ولها السدس تكملة الثلثين. أما إذا وجد بنتان فأكثر من الصلب فلا شيء لبنات الابن إذا كن في درجتهن أو أنزل منهن.",
    },
    wife: {
      name: "wife",
      nameAr: "الزوجة",
      excludedBy: [],
      inheritType1: "fixed",
      effectTypeList: [],
      inheritType2: "",
      effectShareList: ["son", "daughter", "grandSon", "grandDaughter"],
      share1: 1 / 4,
      share2: 1 / 8,
      number: 0,
      judge:
        "المادة 279 - الزوجة: ترث الربع إن لم يكن للميت فرع وارث، والثمن إن وُجد له فرع وارث.",
    },
    husband: {
      name: "husband",
      nameAr: "الزوج",
      excludedBy: [],
      inheritType1: "fixed",
      effectTypeList: [],
      inheritType2: "",
      effectShareList: ["son", "daughter", "grandSon", "grandDaughter"],
      share1: 1 / 2,
      share2: 1 / 4,
      judge:
        "المادة 278 - الزوج: يرث النصف إن لم يكن للميت فرع وارث، والربع إن وُجد له فرع وارث.",
    },
    // he can inherit agnation with self share -- but its rare case
    father: {
      name: "father",
      nameAr: "الأب",

      excludedBy: [],
      inheritType1: "fixed",
      effectTypeList: ["son", "grandSon", "daughter", "grandDaughter"],
      inheritType2: "agnationWSShareList",
      effectShareList: ["son", "grandSon"],
      share1: 1 / 6,
      share2: 1 / 6,
      judge:
        "المادة 279 - الأب:يرث الأب كامل التركة إن لم يوجد وارث آخر، ويرث الباقي بعد أصحاب الفروض إن لم يوجد فرع وارث، ويرث السدس فقط إذا وُجد فرع وارث ذكر، ويرث السدس فرضًا والباقي تعصيبًا إذا وُجد فرع وارث أنثى فقط.",
    },
    mother: {
      name: "mother",
      nameAr: "الأم",

      excludedBy: [],
      inheritType1: "fixed",
      effectTypeList: [],
      inheritType2: "",
      effectShareList: ["son", "grandSon", "daughter", "grandDaughter"],
      share1: 1 / 3,
      share2: 1 / 6,
      judge:
        "المادة 279 - الأم: ترث الثلث إذا لم يوجد فرع وارث ولا اثنان من الإخوة فأكثر، وترث السدس إذا وُجد فرع وارث أو اثنان من الإخوة فأكثر، وترث مع أحد الزوجين وولد واحد السدس والباقي للولد، وتحجب من الثلث إلى السدس بوجود الجمع من الإخوة أو الفرع الوارث .",
    },
    pGrandMother: {
      name: "pGrandMother",
      nameAr: "أم الأب",
      excludedBy: ["mother", "father", "pGrandFather"],
      inheritType1: "fixed",
      effectTypeList: [],
      inheritType2: "",
      effectShareList: [],
      share1: 1 / 6,
      share2: 0,
      judge:
        "المادة 288 - أم الأب (الجدة لأب): ترث السدس إذا لم تكن محجوبة، وتحجب بالأم أو الجدة الأقرب.",
    },
    pGrandFather: {
      name: "pGrandFather",
      nameAr: "أب الأب",
      excludedBy: ["father", "son"],
      inheritType1: "fixed",
      effectTypeList: ["son", "grandSon", "daughter", "grandDaughter"],
      inheritType2: "agnationWSShareList",
      effectShareList: ["son", "grandSon", "daughter", "grandDaughter"],
      share1: 1 / 6,
      share2: 1 / 6,
      judge:
        "المادة 286 - أب الأب (الجد لأب): يرث السدس مع وجود فرع وارث، ويُعامل كالأب إن لم يوجد أب.",
    },
    // which includes brothers and sisters of mother side .
    maternalSiblings: {
      name: "maternalSiblings",
      nameAr: "الإخوة لأم",
      excludedBy: ["father", "son", "grandSon", "daughter", "grandDaughter"],
      inheritType1: "fixed",
      effectTypeList: [],
      inheritType2: "",
      effectShareList: [],
      share1: 1 / 6,
      share2: 1 / 3,
      number: 0,
      judge:
        "المادة 284 - الإخوة لأم: إذا انفرد أحد من الإخوة لأم أو الأخوات لأم فله السدس، وإذا كانوا أكثر من واحد فلهم الثلث يقسم بينهم بالتساوي، ويسقطون عند وجود الفرع الوارث أو الأصل الذكر.",
    },
    fullBrother: {
      name: "fullBrother",
      nameAr: "الأخ الشقيق",
      excludedBy: ["son", "father", "pGrandFather", "grandSon"],
      inheritType1: "agnationWSShareList",
      effectTypeList: ["fullSister"],
      inheritType2: "agnationWOShareList",
      effectShareList: [],
      share1: 0,
      share2: 0,
      number: 0,
      judge:
        "المادة 282 - الإخوة الأشقاء:إذا انفرد الأخ الشقيق أخذ جميع التركة تعصيباً، وإذا تعددوا تقاسموها بالتساوي، وإذا كانت معه أخت شقيقة أخذ ضعف نصيبها، وإن انفردت أخت شقيقة فلها النصف، وإن تعددن فلهن الثلثان، ويسقطن عند وجود الفرع الوارث المذكر أو الأب.",
    },
    fullSister: {
      name: "fullSister",
      nameAr: "الأخت الشقيقة",
      excludedBy: ["son", "father", "pGrandFather", "grandSon"],
      inheritType1: "agnationWSShareList",
      effectTypeList: ["fullBrother"],
      inheritType2: "agnationWOShareList",
      effectShareList: [],
      share1: 0,
      share2: 0,
      number: 0,
      judge:
        "المادة 282 - الإخوة الأشقاء:إذا انفرد الأخ الشقيق أخذ جميع التركة تعصيباً، وإذا تعددوا تقاسموها بالتساوي، وإذا كانت معه أخت شقيقة أخذ ضعف نصيبها، وإن انفردت أخت شقيقة فلها النصف، وإن تعددن فلهن الثلثان، ويسقطن عند وجود الفرع الوارث المذكر أو الأب..",
    },
    paternalSister: {
      name: "paternalSister",
      nameAr: "الأخت لأب",
      excludedBy: ["son", "father", "pGrandFather", "grandSon", "fullBrother"],
      inheritType1: "agnationWSShareList",
      effectTypeList: ["paternalBrother"],
      inheritType2: "agnationWOShareList",
      effectShareList: [],
      share1: 0,
      share2: 0,
      number: 0,
      judge:
        "المادة 283 - الإخوة لأب:إذا انفرد الأخ لأب أخذ جميع التركة تعصيباً، وإذا تعددوا تقاسموها بالتساوي، وإذا كانت معه أخت لأب أخذ ضعف نصيبها، وإن انفردت أخت لأب فلها النصف، وإن تعددن فلهن الثلثان، ويسقطون عند وجود الفرع الوارث المذكر أو الأب أو الإخوة الأشقاء..",
    },
    paternalBrother: {
      name: "paternalBrother",
      nameAr: "الأخ لأب",
      excludedBy: ["son", "father", "pGrandFather", "grandSon", "fullBrother"],
      inheritType1: "agnationWSShareList",
      effectTypeList: ["paternalSister"],
      inheritType2: "agnationWOShareList",
      effectShareList: [],
      share1: 0,
      share2: 0,
      number: 0,
      judge:
        "المادة 283 - الإخوة لأب:إذا انفرد الأخ لأب أخذ جميع التركة تعصيباً، وإذا تعددوا تقاسموها بالتساوي، وإذا كانت معه أخت لأب أخذ ضعف نصيبها، وإن انفردت أخت لأب فلها النصف، وإن تعددن فلهن الثلثان، ويسقطون عند وجود الفرع الوارث المذكر أو الأب أو الإخوة الأشقاء..",
    },
  };
  // catigories
  const fixedShareList = [];

  // agnation with self share
  const agnationWSShareList = [];

  // agnation with others share
  const agnationWOShareList = [];

  // convert iterable map to array using destructering operator .
  const heirList = [...heirsMap.keys()];

  // number should be edited as come from hashmap's values

  // fill number of heris based on recieved map
  function fillNumberOfheirsMap(heirs, heirMap, heirList) {
    for (let i = 0; i < heirList.length; i++) {
      let number = heirMap.get(heirList[i]);
      heirs[heirList[i]].number = number;
    }
  }

  // check if heir is excluded by other heir
  // if so returns true and set reason why heir is excluded
  function checkExcluded(heir, heirs, heirList) {
    let excluded = false;

    switch (heir) {
      default:
        heirs[heir].excludedBy.forEach((item) => {
          if (heirList.includes(item)) {
            excluded = true;
            if (excluded) {
              heirs[heir].judge = proof(
                null,
                heirs[heir].nameAr,
                heirs[item].nameAr
              );
            }
          }
        });
    }

    if (heir == "grandDaughter" && heirs.daughter.number >= 2) {
      excluded = true;
    }
    if (heir == "paternalSister" || heir == "paternalBrother") {
      if (heirs.fullSister.number >= 2) {
        excluded = true;
      }
    }

    return excluded;
  }

  function calsficationSwitch(type, heir, heirs, fSList, aWSSList, aWOSList) {
    switch (heirs[heir][type]) {
      case "fixed":
        fSList.push(heirs[heir]);
        return;
      case "agnationWSShareList":
        aWSSList.push(heirs[heir]);
        return;
      case "agnationWOShareList":
        aWOSList.push(heirs[heir]);
        return;
      default:
        throw new Error(`Invalid inheir type ${heirs[heir].inheritType2}`);
    }
  }

  // if heir is not excluded, check heir type wether it is fixed share or agnation with self share or agnation with others share
  // then call calsficationSwitch to push heir to the right list
  function checkType(
    heir,
    heirs,
    heirList,
    normal,
    fSList,
    aWSSList,
    aWOSList
  ) {
    let type2 = false;
    if (normal) {
      heirs[heir].effectTypeList.forEach((item) => {
        if (heirList.includes(item)) {
          type2 = true;
        }
      });
    } else {
      type2 = true;
      heirs[heir].effectTypeList.forEach((item) => {
        if (heirList.includes(item)) {
          type2 = false;
        }
      });
    }

    if (type2) {
      calsficationSwitch(
        "inheritType2",
        heir,
        heirs,
        fSList,
        aWSSList,
        aWOSList
      );
    } else {
      calsficationSwitch(
        "inheritType1",
        heir,
        heirs,
        fSList,
        aWSSList,
        aWOSList
      );
    }
  }

  function proof(msg, heir, blockedBy) {
    return msg ? msg : ` ${heir}   محجوب/ة بسبب وجود  ${blockedBy}`;
  }

  //
  function categorizeHerit(
    heir,
    heirs,
    heirList,
    normal = true,
    fSList,
    aWSSList,
    aWOSList
  ) {
    if (!checkExcluded(heir, heirs, heirList)) {
      checkType(heir, heirs, heirList, normal, fSList, aWSSList, aWOSList);
    }
  }

  // categorize heir based on signaled  heirs
  function categorizeAll(heirs, heirList, fSList, aWSSList, aWOSList) {
    heirList.forEach((heir) => {
      if (!checkExcluded(heir, heirs, heirList)) {
        categorizeHerit(
          heir,
          heirs,
          heirList,
          heir.match("father") || heir.match("pGrandFather") ? false : true,
          fSList,
          aWSSList,
          aWOSList
        );
      }
    });
    if (heirList.length == 2) {
      let con1 = heirList.find((item) => item == "father");
      let con2 = heirList.find(
        (item) => item == "daughter" || item == "grandDaughter"
      );

      console.log("conditions result ----> " + (con1 && con2));

      if (con1 && con2) {
        aWSSList.push(heirs["father"]);
      }
    }
  }

  fillNumberOfheirsMap(heirs, heirsMap, heirList);

  // categorize herit
  categorizeAll(
    heirs,
    heirList,
    fixedShareList,
    agnationWSShareList,
    agnationWOShareList
  );

  // choose the right share for each heir based on number of heirs and their type
  // and return the share
  const calcShare = function (heirList, heirs) {
    let share;
    let effected = false;
    let numOFSiblings =
      heirs.fullBrother.number +
      heirs.fullSister.number +
      heirs.paternalBrother.number +
      heirs.paternalSister.number +
      heirs.maternalSiblings.number;
    switch (this.name) {
      case "daughter":
        effected = !(this.number === 1);
        break;
      case "grandDaughter":
        if (heirs["daughter"].number == 1) {
          share = this.share3;
          return share;
        } else {
          effected = !(this.number === 1);
        }
        break;
      case "maternalSiblings":
        effected = !(heirs["maternalSiblings"].number === 1);

        break;
      default:
        this.effectShareList.forEach((item) => {
          if (heirList.includes(item)) {
            effected = true;
          }
        });
        if (this.name == "mother" && numOFSiblings >= 2) {
          effected = true;
        }
    }
    share = effected ? this.share2 : this.share1;
    return share;
  };

  for (let i = 0; i < fixedShareList.length; i++) {
    fixedShareList[i].calcShare = calcShare.bind(fixedShareList[i]);
  }

  // awl must be called if total share is greater than estate
  // it will adjust the shares of heirs based on the estate
  function awl(estate, fSList, totalShare) {
    console.log("awl applied");
    const awlFactor = estate / totalShare;
    totalShare = 0;
    for (let i = 0; i < fSList.length; i++) {
      totalShare += fSList[i].estate = fSList[i].estate * awlFactor;
    }

    return "total share after awl is: " + totalShare;
  }

  const isOmaria = (heirList) => {
    let counter = 0;
    console.log("Omaria Case .");
    for (let i = 0; i < 3; i++) {
      if (
        heirList[i] == "wife" ||
        heirList[i] == "husband" ||
        heirList[i] == "father" ||
        heirList[i] == "mother"
      ) {
        counter++;
      }
    }
    return counter === 3;
  };
  function calculateFixedShare(estate, fSList, heirList, heirs) {
    let totalShare = 0;

    for (let i = 0; i < fSList.length; i++) {
      totalShare += fSList[i].estate =
        estate * fSList[i].calcShare(heirList, heirs);
    }
    const doAwl = totalShare > estate;
    if (doAwl) {
      awl(estate, fSList, totalShare);
      return 0;
    }

    return estate - totalShare;
  }
  function calculateAganationWOShare(estate, aWOSList, heirs) {
    const woList = [];
    for (let i = 0; i < aWOSList.length; i++) {
      woList.push(aWOSList[i].name);
    }
    console.log("awsshare ----------" + agnationWSShareList);

    if (woList.includes("son")) {
      let share = estate / (heirs.son.number * 2 + heirs.daughter.number);
      heirs.son.estate = share * 2 * heirs.son.number;
      heirs.daughter.estate = share * heirs.daughter.number;
      return 0;
    } else if (woList.includes("grandSon")) {
      let share =
        estate / (heirs.grandSon.number * 2 + heirs.grandDaughter.number);
      heirs.grandSon.estate = share * 2 * heirs.grandSon.number;
      heirs.grandDaughter.estate = share * heirs.grandDaughter.number;
      return 0;
    } else if (woList.includes("fullBrother")) {
      let share =
        estate / (heirs.fullBrother.number * 2 + heirs.fullSister.number);
      heirs.fullBrother.estate = share * 2 * heirs.fullBrother.number;
      heirs.fullSister.estate = share * heirs.fullSister.number;
      return 0;
    } else if (woList.includes("paternalBrother")) {
      let share =
        estate /
        (heirs.paternalBrother.number * 2 + heirs.paternalSister.number);
      heirs.paternalBrother.estate = share * 2 * heirs.paternalBrother.number;
      heirs.paternalSister.estate = share * heirs.paternalSister.number;
      return 0;
    }
    return estate;
  }
  function calculateAganationWSShare(estate, aWSSList, heirs) {
    if (aWSSList.length > 1) {
      throw new Error("Invalid agnation with self share");
    } else if (aWSSList.length == 1) {
      console.log(estate);
      if (heirs[aWSSList[0].name].estate) {
        console.log("before aganation " + heirs[aWSSList[0].name].estate);
        heirs[aWSSList[0].name].estate += estate;
      } else {
        heirs[aWSSList[0].name].estate = estate;
      }
      console.log(aWSSList[0]);
      return 0;
    }

    return estate;
  }

  function sumFixedShare(heirList, heirs, fSList) {
    let sum = 0;
    for (let i = 0; i < fSList.length; i++) {
      if (fSList[i].name != "husband" && fSList[i].name != "wife") {
        sum += fSList[i].calcShare(heirList, heirs);
      }
    }
    return sum;
  }
  function returnResidue(estate, heirList, heirs, fSList) {
    console.log("Return Residue Applied ");
    const sum = sumFixedShare(heirList, heirs, fSList);
    fSList.forEach((heir) => {
      const share = heir.calcShare(heirList, heirs);

      if (heir.name != "wife" && heir.name != "husband") {
        heir.estate += share + (share / sum) * estate;
      }
    });
  }

  const estateAfterFixed = calculateFixedShare(
    estate,
    fixedShareList,
    heirList,
    heirs
  );

  const estateAfterAganationWS = calculateAganationWSShare(
    estateAfterFixed,
    agnationWSShareList,
    heirs
  );

  const estateAfterAganationWO = calculateAganationWOShare(
    estateAfterAganationWS,
    agnationWOShareList,
    heirs
  );
  console.log(agnationWSShareList);
  if (estateAfterAganationWO > 0 && !isOmaria(heirList)) {
    returnResidue(estateAfterAganationWO, heirList, heirs, fixedShareList);
  }

  function changeShare(list, estate) {
    let mother;
    let WH;
    let father = list[2];
    if (list[0].name == "mother") {
      mother = list[0];
      WH = list[1];
    } else {
      mother = list[1];
      WH = list[0];
    }

    mother.estate = Math.round((mother.estate / estate) * (estate - WH.estate));

    father.estate = Math.round(estate - (WH.estate + mother.estate));
  }
  if (isOmaria(heirList && heirList.length === 3)) {
    changeShare([...fixedShareList, ...agnationWSShareList], estate);
  }

  // return list of heirs with their estate and judge
  function formatResult(heirList, heirs, estate) {
    console.log("totaly: " + totalState(heirs, heirList));
    const result = [];
    if (totalState(heirs, heirList) > estate) {
      adjustAround(
        deserveEstate(heirs, heirList),
        heirs,
        heirList,
        totalState(heirs, heirList) - estate
      );
    }
    heirList.forEach((heir) => {
      result.push({
        heir: heirs[heir].nameAr,
        share: heirs[heir].estate || 0,
        judge: heirs[heir].judge,
        count: heirs[heir].number,
      });
    });
    console.log("result: ", result);
    return result;
  }
  function totalState(heirs, heirList) {
    let estate = 0;
    heirList.forEach((heir) => {
      if (heirs[heir].estate) estate += heirs[heir].estate;
    });
    console.log("total estate: " + estate);
    return estate;
  }

  function adjustAround(count, heirs, heirList, plus) {
    const tookOver = plus / count;

    console.log("took over" + tookOver);
    heirList.forEach((heir) => {
      if (heirs[heir] && heirs[heir].estate !== 0) {
        heirs[heir].estate -= tookOver;
        console.log("heeeee" + heirs[heir].estate);
      }
    });
    console.log("toook doneeeeeeee");
  }
  function deserveEstate(heirs, heirList) {
    let count = 0;

    heirList.forEach((heir) => {
      if (heirs[heir].estate) {
        count++;
      }
    });
    console.log("deservers ------------- " + count);
    return count;
  }

  return formatResult(heirList, heirs, estate);
}
