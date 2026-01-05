(() => {
  "use strict";

  const nameInput = document.getElementById("nameInput");
  const photoInput = document.getElementById("photoInput");
  const downloadBtn = document.getElementById("downloadBtn");
  const resetBtn = document.getElementById("resetBtn");
  const statusEl = document.getElementById("status");
  const canvas = document.getElementById("posterCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });

  let EXPORT_W = 1080;
  let EXPORT_H = 1350;

  const BACKGROUND_FILE = "bg.png";

  const LAYOUT = {
    photo: {
      cx: 0.79,
      cy: 0.65,
      diameter: 0.35,
    },
    name: {
      cx: 0.79,
      cy: 0.885,
      maxWidth: 0.20,
    },
  };

  const state = {
    name: "",
    userImage: null,
    bgImage: null,
  };

  function setStatus(text, kind = "") {
    statusEl.textContent = text;
    statusEl.classList.toggle("error", kind === "error");
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function fitCover(srcW, srcH, dstW, dstH) {
    const srcAR = srcW / srcH;
    const dstAR = dstW / dstH;

    let sW;
    let sH;
    if (srcAR > dstAR) {
      sH = srcH;
      sW = Math.round(srcH * dstAR);
    } else {
      sW = srcW;
      sH = Math.round(srcW / dstAR);
    }

    const sX = Math.round((srcW - sW) / 2);
    const sY = Math.round((srcH - sH) / 2);
    return { sX, sY, sW, sH };
  }

  function buildFallbackBackgroundDataUrl() {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${EXPORT_W}" height="${EXPORT_H}" viewBox="0 0 ${EXPORT_W} ${EXPORT_H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0B0F17"/>
      <stop offset="1" stop-color="#090B12"/>
    </linearGradient>
    <radialGradient id="glow1" cx="20%" cy="18%" r="60%">
      <stop offset="0" stop-color="#FF3DA4" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#FF3DA4" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="85%" cy="10%" r="55%">
      <stop offset="0" stop-color="#6AE4FF" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#6AE4FF" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#glow1)"/>
  <rect width="100%" height="100%" fill="url(#glow2)"/>

  <g opacity="0.95">
    <text x="80" y="150" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" font-size="76" font-weight="800" fill="#FFFFFF" letter-spacing="1">VIP NIGHT</text>
    <text x="80" y="220" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" font-size="30" font-weight="650" fill="#C8D0E0" letter-spacing="0.6">LIVE MUSIC • DJ • FOOD</text>
  </g>

  <g opacity="0.85">
    <rect x="80" y="1010" width="920" height="220" rx="28" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)"/>
    <text x="120" y="1078" font-family="ui-sans-serif, system-ui" font-size="26" font-weight="750" fill="#FFFFFF">FRI • 9:00 PM</text>
    <text x="120" y="1124" font-family="ui-sans-serif, system-ui" font-size="20" font-weight="600" fill="#C8D0E0">Downtown Arena</text>

    <text x="120" y="1185" font-family="ui-sans-serif, system-ui" font-size="18" font-weight="600" fill="#C8D0E0">ENTRY PASS</text>
    <rect x="780" y="1060" width="180" height="140" rx="16" fill="rgba(0,0,0,0.22)" stroke="rgba(255,255,255,0.16)"/>
    <path d="M805 1120 h130" stroke="rgba(255,255,255,0.35)" stroke-width="6" stroke-linecap="round"/>
    <path d="M805 1160 h100" stroke="rgba(255,255,255,0.22)" stroke-width="6" stroke-linecap="round"/>
  </g>

  <g filter="url(#soft)" opacity="0.6">
    <circle cx="880" cy="520" r="140" fill="#FF3DA4"/>
    <circle cx="920" cy="520" r="115" fill="#6AE4FF" opacity="0.55"/>
  </g>

  <g opacity="0.25">
    <path d="M0 910 C 240 820 420 980 620 920 C 780 875 880 760 1080 820 L1080 1350 L0 1350 Z" fill="#FFFFFF"/>
  </g>
</svg>`;

    const encoded = encodeURIComponent(svg)
      .replace(/%0A/g, "")
      .replace(/%20/g, " ")
      .replace(/%3D/g, "=")
      .replace(/%3A/g, ":")
      .replace(/%2F/g, "/");

    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  }

  function initCanvas() {
    const dpr = window.devicePixelRatio || 1;

    const parentWidth = canvas.parentElement ? canvas.parentElement.clientWidth : 600;
    const cssWidth = clamp(parentWidth, 280, 900);
    const cssHeight = Math.round(cssWidth * (EXPORT_H / EXPORT_W));

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    render();
  }

  function drawRoundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawCircularImage(img, cx, cy, diameter) {
    const r = diameter / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const { sX, sY, sW, sH } = fitCover(img.naturalWidth || img.width, img.naturalHeight || img.height, diameter, diameter);
    ctx.drawImage(img, sX, sY, sW, sH, cx - r, cy - r, diameter, diameter);

    ctx.restore();
  }

  function drawName(name, xCenter, y, maxWidth, canvasW, options = {}) {
    const safe = (name || "").trim() || "your name";

    const baseFontSize = Math.round(canvasW * 0.07);
    const minFontSize = Math.round(canvasW * 0.045);

    let fontSize = baseFontSize;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    while (fontSize > minFontSize) {
      ctx.font = `800 ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
      if (ctx.measureText(safe).width <= maxWidth) break;
      fontSize -= 2;
    }

    ctx.save();
    ctx.shadowColor = options.shadowColor ?? "rgba(0,0,0,0.55)";
    ctx.shadowBlur = options.shadowBlur ?? 18;

    ctx.fillStyle = options.fillStyle ?? "#FFFFFF";
    ctx.fillText(safe, xCenter, y);

    ctx.shadowBlur = 0;
    if (options.strokeStyle) {
      ctx.lineWidth = options.strokeWidth ?? Math.max(3, Math.round(canvasW * 0.004));
      ctx.strokeStyle = options.strokeStyle;
      ctx.strokeText(safe, xCenter, y);
    }

    ctx.restore();
  }

  function render() {
    const cssW = parseFloat(canvas.style.width) || 600;
    const cssH = parseFloat(canvas.style.height) || Math.round(cssW * (EXPORT_H / EXPORT_W));

    ctx.clearRect(0, 0, cssW, cssH);

    if (state.bgImage) {
      ctx.drawImage(state.bgImage, 0, 0, cssW, cssH);
    } else {
      ctx.fillStyle = "#0b0f17";
      ctx.fillRect(0, 0, cssW, cssH);
    }

    const w = cssW;
    const h = cssH;

    const photoCx = Math.round(w * LAYOUT.photo.cx);
    const photoCy = Math.round(h * LAYOUT.photo.cy);
    const photoDiameter = Math.round(w * LAYOUT.photo.diameter);

    if (state.userImage) {
      drawCircularImage(state.userImage, photoCx, photoCy, photoDiameter);
    }

    const nameCenterX = Math.round(w * LAYOUT.name.cx);
    const nameCenterY = Math.round(h * LAYOUT.name.cy);
    const nameMaxWidth = Math.round(w * LAYOUT.name.maxWidth);
    drawName(state.name, nameCenterX, nameCenterY, nameMaxWidth, w, {
      fillStyle: "#1a1a1a",
      shadowColor: "rgba(255,255,255,0.35)",
      shadowBlur: 10,
      strokeStyle: "rgba(0,0,0,0.15)",
      strokeWidth: Math.max(2, Math.round(w * 0.0035)),
    });

    const ready = Boolean(state.userImage);
    downloadBtn.disabled = !ready;
  }

  async function renderExportCanvas() {
    const out = document.createElement("canvas");
    out.width = EXPORT_W;
    out.height = EXPORT_H;

    const outCtx = out.getContext("2d", { alpha: false });
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = "high";

    if (state.bgImage) {
      outCtx.drawImage(state.bgImage, 0, 0, EXPORT_W, EXPORT_H);
    } else {
      outCtx.fillStyle = "#0b0f17";
      outCtx.fillRect(0, 0, EXPORT_W, EXPORT_H);
    }

    const photoCx = Math.round(EXPORT_W * LAYOUT.photo.cx);
    const photoCy = Math.round(EXPORT_H * LAYOUT.photo.cy);
    const photoDiameter = Math.round(EXPORT_W * LAYOUT.photo.diameter);
    

    if (state.userImage) {
      const r = photoDiameter / 2;

      outCtx.save();
      outCtx.beginPath();
      outCtx.arc(photoCx, photoCy, r, 0, Math.PI * 2);
      outCtx.closePath();
      outCtx.clip();

      const { sX, sY, sW, sH } = fitCover(
        state.userImage.naturalWidth || state.userImage.width,
        state.userImage.naturalHeight || state.userImage.height,
        photoDiameter,
        photoDiameter
      );

      outCtx.drawImage(state.userImage, sX, sY, sW, sH, photoCx - r, photoCy - r, photoDiameter, photoDiameter);
      outCtx.restore();
    }

    {
      const safe = (state.name || "").trim() || "your name";
      const nameCenterX = Math.round(EXPORT_W * LAYOUT.name.cx);
      const nameCenterY = Math.round(EXPORT_H * LAYOUT.name.cy);
      const maxWidth = Math.round(EXPORT_W * LAYOUT.name.maxWidth);

      const baseFontSize = Math.round(EXPORT_W * 0.06);
      const minFontSize = Math.round(EXPORT_W * 0.04);
      let fontSize = baseFontSize;

      while (fontSize > minFontSize) {
        outCtx.font = `800 ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
        if (outCtx.measureText(safe).width <= maxWidth) break;
        fontSize -= 2;
      }

      outCtx.save();
      outCtx.textAlign = "center";
      outCtx.textBaseline = "middle";
      outCtx.shadowColor = "rgba(255,255,255,0.35)";
      outCtx.shadowBlur = 12;
      outCtx.fillStyle = "#1a1a1a";
      outCtx.fillText(safe, nameCenterX, nameCenterY);
      outCtx.shadowBlur = 0;
      outCtx.lineWidth = Math.max(4, Math.round(EXPORT_W * 0.0035));
      outCtx.strokeStyle = "rgba(0,0,0,0.15)";
      outCtx.strokeText(safe, nameCenterX, nameCenterY);
      outCtx.restore();
    }

    return out;
  }

  function downloadCanvasPng(outCanvas) {
    const a = document.createElement("a");
    a.download = "event-poster.png";
    a.href = outCanvas.toDataURL("image/png");
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      img.src = url;
    });
  }

  function wireEvents() {
    nameInput.addEventListener("input", () => {
      state.name = nameInput.value;
      render();

      if (!state.userImage && !(state.name || "").trim()) {
        setStatus("Add a name and photo to begin");
      } else if (!state.userImage) {
        setStatus("Now upload a photo");
      } else if (!(state.name || "").trim()) {
        setStatus("Now type your name");
      } else {
        setStatus("Ready to download");
      }
    });

    photoInput.addEventListener("change", async () => {
      const file = photoInput.files && photoInput.files[0];
      if (!file) {
        state.userImage = null;
        render();
        return;
      }

      if (!file.type || !file.type.startsWith("image/")) {
        setStatus("Please upload an image file.", "error");
        photoInput.value = "";
        state.userImage = null;
        render();
        return;
      }

      try {
        setStatus("Loading photo…");
        state.userImage = await loadImageFromFile(file);
        render();

        if (!(state.name || "").trim()) {
          setStatus("Photo added. Now type your name");
        } else {
          setStatus("Ready to download");
        }
      } catch {
        setStatus("Could not read that image. Try another.", "error");
        photoInput.value = "";
        state.userImage = null;
        render();
      }
    });

    downloadBtn.addEventListener("click", async () => {
      if (!state.userImage) {
        setStatus("Upload a photo before downloading.", "error");
        return;
      }

      try {
        setStatus("Preparing download…");
        const out = await renderExportCanvas();
        downloadCanvasPng(out);
        setStatus("Downloaded. You can edit and download again.");
      } catch {
        setStatus("Download failed. Please try again.", "error");
      }
    });

    resetBtn.addEventListener("click", () => {
      nameInput.value = "";
      photoInput.value = "";
      state.name = "";
      state.userImage = null;
      render();
      setStatus("Add a name and photo to begin");
    });

    window.addEventListener("resize", () => {
      initCanvas();
    });
  }

  async function bootstrap() {
    canvas.width = 900;
    canvas.height = 1125;

    const bg = new Image();
    bg.onload = () => {
      state.bgImage = bg;
      EXPORT_W = bg.naturalWidth || EXPORT_W;
      EXPORT_H = bg.naturalHeight || EXPORT_H;
      initCanvas();
      setStatus("Add a name and photo to begin");
    };
    bg.onerror = () => {
      const fallback = new Image();
      fallback.onload = () => {
        state.bgImage = fallback;
        initCanvas();
        setStatus(`Place your background image as \'${BACKGROUND_FILE}\' in this folder (using fallback now).`, "error");
      };
      fallback.onerror = () => {
        state.bgImage = null;
        initCanvas();
        setStatus("Background failed to load.", "error");
      };
      fallback.src = buildFallbackBackgroundDataUrl();
    };
    bg.src = BACKGROUND_FILE;

    wireEvents();
  }

  bootstrap();
})();
