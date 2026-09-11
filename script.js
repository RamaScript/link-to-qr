const input = document.getElementById("qr-input");
const inputLabel = document.getElementById("input-label");
const generateBtn = document.getElementById("generate-btn");
const qrCode = document.getElementById("qr-code");
const downloadBtn = document.getElementById("download-btn");
const copyBtn = document.getElementById("copy-btn");
const status = document.getElementById("status");
const customizeToggle = document.getElementById("customize-toggle");
const customizePanel = document.getElementById("customize-panel");
const chevron = document.getElementById("chevron");
const fgColor = document.getElementById("fg-color");
const bgColor = document.getElementById("bg-color");
const qrSize = document.getElementById("qr-size");

let qr;
let currentType = "url";

const presets = {
  url: {
    label: "Enter URL",
    type: "url",
    placeholder: "https://example.com",
    value: "https://www.ramascript.com"
  },
  text: {
    label: "Enter text",
    type: "text",
    placeholder: "Type anything you want to share",
    value: "Hello from QR Code Generator!"
  },
  wifi: {
    label: "Wi-Fi details",
    type: "text",
    placeholder: "WIFI:T:WPA;S:MyNetwork;P:Password;;",
    value: "WIFI:T:WPA;S:MyNetwork;P:Password;;"
  },
  email: {
    label: "Email address",
    type: "email",
    placeholder: "hello@example.com",
    value: "hello@example.com"
  },
  phone: {
    label: "Phone number",
    type: "tel",
    placeholder: "+91 98765 43210",
    value: "+919876543210"
  }
};

function setStatus(message, error = false) {
  status.textContent = message;
  status.style.color = error ? "#c54b4b" : "#238f6b";
  clearTimeout(setStatus.timer);
  setStatus.timer = setTimeout(() => status.textContent = "", 2500);
}

function payload() {
  const value = input.value.trim();

  if (!value) {
    setStatus("Enter something first.", true);
    input.focus();
    return null;
  }

  if (currentType === "email" && !value.startsWith("mailto:")) {
    return `mailto:${value}`;
  }

  if (currentType === "phone" && !value.startsWith("tel:")) {
    return `tel:${value}`;
  }

  return value;
}

function generate() {
  const value = payload();
  if (!value) return;

  qrCode.innerHTML = "";

  qr = new QRCode(qrCode, {
    text: value,
    width: Number(qrSize.value),
    height: Number(qrSize.value),
    colorDark: fgColor.value,
    colorLight: bgColor.value,
    correctLevel: QRCode.CorrectLevel.H
  });

  setStatus("QR code updated.");
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    const type = tab.dataset.type;

    if (!presets[type]) {
      setStatus("More QR types coming soon.");
      return;
    }

    currentType = type;

    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const preset = presets[type];
    inputLabel.textContent = preset.label;
    input.type = preset.type;
    input.placeholder = preset.placeholder;
    input.value = preset.value;

    generate();
  });
});

generateBtn.addEventListener("click", generate);

input.addEventListener("keydown", event => {
  if (event.key === "Enter") generate();
});

customizeToggle.addEventListener("click", () => {
  customizePanel.classList.toggle("open");
  chevron.textContent = customizePanel.classList.contains("open") ? "⌃" : "⌄";
});

[fgColor, bgColor, qrSize].forEach(control => {
  control.addEventListener("input", generate);
  control.addEventListener("change", generate);
});

downloadBtn.addEventListener("click", () => {
  if (!qr) {
    generate();
    return;
  }

  const canvas = qrCode.querySelector("canvas");
  const image = qrCode.querySelector("img");

  let source = canvas ? canvas.toDataURL("image/png") : image?.src;
  if (!source) return;

  const link = document.createElement("a");
  link.download = "qr-code.png";
  link.href = source;
  link.click();
  setStatus("Downloaded QR code.");
});

copyBtn.addEventListener("click", async () => {
  const value = input.value.trim();
  if (!value) return;

  try {
    await navigator.clipboard.writeText(value);
    setStatus("Content copied.");
  } catch {
    input.select();
    document.execCommand("copy");
    setStatus("Content copied.");
  }
});

// Initial QR code.
generate();
