/**
 * Link to QR — Fast, Client-Side Neo-Brutalist QR Engine
 * Deployed at: https://qr.ramascript.com/
 * Developer: Ramanand Kumar (ramascript.com)
 */

// DOM Elements
const input = document.getElementById("qr-input");
const inputLabel = document.getElementById("input-label");
const charCounter = document.getElementById("char-counter");
const clearInputBtn = document.getElementById("clear-input-btn");
const generateBtn = document.getElementById("generate-btn");
const qrTarget = document.getElementById("qr-code");
const downloadBtn = document.getElementById("download-btn");
const copyImgBtn = document.getElementById("copy-img-btn");
const statusBar = document.getElementById("status-bar");
const statusText = document.getElementById("status-text");
const resetBtn = document.getElementById("reset-btn");

// Tweaks
const fgColor = document.getElementById("fg-color");
const bgColor = document.getElementById("bg-color");
const qrSize = document.getElementById("qr-size");
const errorLevel = document.getElementById("error-level");
const tabBtns = document.querySelectorAll(".tab-btn");

let qrInstance = null;
let currentType = "url";
let debounceTimer = null;
let statusTimer = null;

// Presets configuration
const presets = {
  url: {
    label: "ENTER LINK",
    placeholder: "https://qr.ramascript.com/",
    fallback: "https://qr.ramascript.com/"
  },
  text: {
    label: "ENTER TEXT",
    placeholder: "https://qr.ramascript.com/",
    fallback: "https://qr.ramascript.com/"
  },
  wifi: {
    label: "WI-FI DETAILS",
    placeholder: "WIFI:T:WPA;S:MyNetwork;P:MyPassword;;",
    fallback: "WIFI:T:WPA;S:MyNetwork;P:MyPassword;;"
  },
  email: {
    label: "EMAIL ADDRESS",
    placeholder: "hello@example.com",
    fallback: "mailto:hello@example.com"
  },
  phone: {
    label: "PHONE NUMBER",
    placeholder: "+1 555 123 4567",
    fallback: "tel:+15551234567"
  }
};

/**
 * Format terminal-style status updates
 */
function setStatus(message, type = "normal") {
  clearTimeout(statusTimer);
  statusText.textContent = `STATUS: ${message.toUpperCase()}`;

  statusBar.classList.remove("error", "updated");
  if (type === "error") {
    statusBar.classList.add("error");
  } else if (type === "success") {
    statusBar.classList.add("updated");
  }

  statusTimer = setTimeout(() => {
    statusText.textContent = "STATUS: READY";
    statusBar.classList.remove("error", "updated");
  }, 3200);
}

/**
 * Update character counter
 */
function updateCounter() {
  const count = input.value.length;
  charCounter.textContent = `${count} char${count === 1 ? "" : "s"}`;
}

/**
 * Get active payload
 */
function getActivePayload() {
  const raw = input.value.trim();
  if (raw) {
    if (currentType === "email" && !raw.startsWith("mailto:")) {
      return `mailto:${raw}`;
    }
    if (currentType === "phone" && !raw.startsWith("tel:")) {
      return `tel:${raw}`;
    }
    return raw;
  }

  return presets[currentType]?.fallback || "https://qr.ramascript.com/";
}

/**
 * Render standard preview QR Code
 */
function generate() {
  const payload = getActivePayload();
  const levelKey = errorLevel.value || "H";
  const correctLevel = QRCode.CorrectLevel[levelKey] ?? QRCode.CorrectLevel.H;

  // Clear previous output
  qrTarget.innerHTML = "";

  try {
    qrInstance = new QRCode(qrTarget, {
      text: payload,
      width: 240,
      height: 240,
      colorDark: fgColor.value,
      colorLight: bgColor.value,
      correctLevel: correctLevel
    });

    const isDefault = !input.value.trim();
    if (isDefault) {
      setStatus("READY");
    } else {
      setStatus(`UPDATED [${qrSize.value}px // ${levelKey}]`, "success");
    }
  } catch (err) {
    setStatus("GENERATION FAILED // CHECK INPUT", "error");
    console.error(err);
  }
}

/**
 * Build pristine, high-resolution export canvas with quiet-zone padding
 */
function buildHighQualityQRCanvas() {
  const payload = getActivePayload();
  const selectedSize = Number(qrSize.value) || 500;
  const renderSize = Math.max(selectedSize * 2, 1200);
  const levelKey = errorLevel.value || "H";
  const correctLevel = QRCode.CorrectLevel[levelKey] ?? QRCode.CorrectLevel.H;

  const tempWrap = document.createElement("div");
  tempWrap.style.cssText = "position:absolute;left:-99999px;top:-99999px;visibility:hidden;";
  document.body.appendChild(tempWrap);

  try {
    new QRCode(tempWrap, {
      text: payload,
      width: renderSize,
      height: renderSize,
      colorDark: fgColor.value,
      colorLight: bgColor.value,
      correctLevel: correctLevel
    });

    const rawCanvas = tempWrap.querySelector("canvas");
    if (!rawCanvas) {
      document.body.removeChild(tempWrap);
      return null;
    }

    // Standard QR Quiet Zone: ~10% margin around the code
    const quietZone = Math.round(renderSize * 0.10);
    const totalSize = renderSize + (quietZone * 2);

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = totalSize;
    exportCanvas.height = totalSize;
    const ctx = exportCanvas.getContext("2d");

    // Background fill
    ctx.fillStyle = bgColor.value;
    ctx.fillRect(0, 0, totalSize, totalSize);

    // Draw QR code with crisp pixels
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(rawCanvas, quietZone, quietZone, renderSize, renderSize);

    document.body.removeChild(tempWrap);
    return exportCanvas;
  } catch (err) {
    console.error("Export canvas error:", err);
    if (tempWrap.parentNode) document.body.removeChild(tempWrap);
    return null;
  }
}

/**
 * Debounced live generation
 */
function liveGenerate() {
  updateCounter();
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    generate();
  }, 180);
}

// Tab Switching
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type;
    if (!presets[type]) return;

    currentType = type;
    tabBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const preset = presets[type];
    inputLabel.textContent = preset.label;
    input.placeholder = preset.placeholder;
    input.value = "";

    updateCounter();
    generate();
  });
});

// Input handling
input.addEventListener("input", liveGenerate);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    generate();
  }
});

// Clear input button
clearInputBtn.addEventListener("click", () => {
  input.value = "";
  updateCounter();
  input.focus();
  generate();
  setStatus("INPUT CLEARED");
});

// Explicit Generate Button
if (generateBtn) {
  generateBtn.addEventListener("click", () => {
    generate();
    setStatus("QR CODE GENERATED", "success");
  });
}

// Tweak controls
fgColor.addEventListener("input", liveGenerate);
bgColor.addEventListener("input", liveGenerate);
qrSize.addEventListener("change", generate);
errorLevel.addEventListener("change", generate);

// Download as High-Definition PNG
downloadBtn.addEventListener("click", () => {
  const exportCanvas = buildHighQualityQRCanvas();
  if (!exportCanvas) {
    setStatus("EXPORT ERROR", "error");
    return;
  }

  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);
  link.download = `link-to-qr-${currentType}-${timestamp}.png`;
  link.href = exportCanvas.toDataURL("image/png");
  link.click();

  setStatus("DOWNLOADED HD PNG", "success");
});

// Copy High-Definition QR image to clipboard
copyImgBtn.addEventListener("click", async () => {
  const exportCanvas = buildHighQualityQRCanvas();
  if (!exportCanvas) {
    setStatus("CANNOT COPY IMAGE", "error");
    return;
  }

  try {
    exportCanvas.toBlob(async (blob) => {
      if (!blob) {
        setStatus("IMAGE ERROR", "error");
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        setStatus("IMAGE COPIED TO CLIPBOARD", "success");
      } catch (err) {
        console.warn("Direct clipboard image copy failed:", err);
        await navigator.clipboard.writeText(exportCanvas.toDataURL());
        setStatus("COPIED IMAGE URL", "success");
      }
    }, "image/png");
  } catch (err) {
    setStatus("CLIPBOARD ERROR", "error");
  }
});

// Reset button
resetBtn.addEventListener("click", () => {
  currentType = "url";
  tabBtns.forEach(b => b.classList.remove("active"));
  document.querySelector('.tab-btn[data-type="url"]')?.classList.add("active");

  const preset = presets.url;
  inputLabel.textContent = preset.label;
  input.placeholder = preset.placeholder;
  input.value = "";

  fgColor.value = "#000000";
  bgColor.value = "#ffffff";
  qrSize.value = "300";
  errorLevel.value = "H";

  updateCounter();
  generate();
  setStatus("RESET COMPLETE", "success");
});

// Initialization
updateCounter();
generate();
