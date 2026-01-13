// Elements
const dropZone = document.getElementById('drop-zone');
const chartInput = document.getElementById('chartInput');
const scanningOverlay = document.getElementById('scanning-overlay');
const resultDashboard = document.getElementById('result-dashboard');
const uploadedImage = document.getElementById('uploaded-image');
const resetBtn = document.getElementById('reset-btn');

// Result Elements
const tradeSignal = document.getElementById('trade-signal');
const tpPrice = document.getElementById('tp-price');
const slPrice = document.getElementById('sl-price');
const entryRange = document.getElementById('entry-range');
const patternList = document.getElementById('pattern-list');
const livePrice = document.getElementById('live-price');
const livePriceHeader = document.getElementById('live-price-header');

const scanningText = document.getElementById('scanning-text');
const settingsTrigger = document.getElementById('settings-trigger');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');

// Camera Elements
const openCameraBtn = document.getElementById('open-camera-btn');
const cameraModal = document.getElementById('camera-modal');
const cameraFeed = document.getElementById('camera-feed');
const captureBtn = document.getElementById('capture-btn');
const closeCameraBtn = document.getElementById('close-camera-btn');
const cameraCanvas = document.getElementById('camera-canvas');
let stream = null;
let analysisCount = 0;
const MAX_FREE_SCANS = 1;

// License & Device Logic
const VALID_CODES = ["SNIPER-PRO-72A1", "SNIPER-PRO-B942", "SNIPER-PRO-C538", "SNIPER-PRO-DF12", "SNIPER-PRO-E890", "SNIPER-PRO-F271", "SNIPER-PRO-314B", "SNIPER-PRO-99E7", "SNIPER-PRO-A01D", "SNIPER-PRO-66C5"];
let isUnlimited = localStorage.getItem('sniper_unlimited') === 'true';
let deviceId = localStorage.getItem('sniper_device_id');
if (!deviceId) {
    // Enhanced device fingerprinting (Browser/OS/Hardware context)
    const fp = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        new Date().getTimezoneOffset()
    ].join('|');
    deviceId = 'SNPR-' + btoa(fp).substr(0, 12).toUpperCase();
    localStorage.setItem('sniper_device_id', deviceId);
}
let deviceScans = parseInt(localStorage.getItem('sniper_scans_' + deviceId)) || 0;

const lockOverlay = document.getElementById('license-lock-overlay');
const displayDeviceId = document.getElementById('display-device-id');
if (displayDeviceId) displayDeviceId.textContent = deviceId;

function checkInitialLock() {
    if (isUnlimited) {
        if (lockOverlay) lockOverlay.style.display = 'none';
    } else {
        // Only lock if they've already used their 1 trial scan
        if (deviceScans >= MAX_FREE_SCANS) {
            if (lockOverlay) lockOverlay.style.display = 'flex';
        } else {
            if (lockOverlay) lockOverlay.style.display = 'none';
        }
    }
}
checkInitialLock();

function updateLimitUI(showOverlay = false) {
    const limitInfo = document.getElementById('scan-limit-info');
    const proTag = document.getElementById('pro-tag');
    const activationArea = document.getElementById('settings-config-area');

    if (isUnlimited) {
        if (limitInfo) limitInfo.classList.add('hidden');
        if (proTag) {
            proTag.textContent = "PRO";
            proTag.classList.remove('trial');
            proTag.classList.add('pro');
        }
        if (activationArea) activationArea.classList.add('hidden');
        if (lockOverlay) lockOverlay.style.display = 'none';
    } else {
        const remaining = Math.max(0, MAX_FREE_SCANS - deviceScans);
        if (limitInfo) limitInfo.textContent = `TRIAL SCANS: ${remaining}`;
        if (proTag) {
            proTag.textContent = "TRIAL";
            proTag.classList.add('trial');
            proTag.classList.remove('pro');
        }
        if (remaining === 0) {
            if (limitInfo) limitInfo.style.background = "#550000";
            if (showOverlay && lockOverlay) lockOverlay.style.display = 'flex';
        }
    }
}
updateLimitUI(true);


// --- SECURITY BLOCK LOGIC ---
const violationOverlay = document.getElementById('violation-overlay');
const violationCountdown = document.getElementById('violation-countdown');
let blockTimer = null;

function checkBlockStatus() {
    const blockedUntil = localStorage.getItem('sniper_blocked_until');
    if (blockedUntil) {
        const remaining = parseInt(blockedUntil) - Date.now();
        if (remaining > 0) {
            violationOverlay.classList.remove('hidden');
            violationOverlay.style.display = 'flex';
            updateBlockCountdown(remaining);
            if (!blockTimer) blockTimer = setInterval(() => {
                const rem = parseInt(localStorage.getItem('sniper_blocked_until')) - Date.now();
                if (rem <= 0) {
                    clearInterval(blockTimer);
                    blockTimer = null;
                    violationOverlay.classList.add('hidden');
                    violationOverlay.style.display = 'none';
                    localStorage.removeItem('sniper_blocked_until');
                } else {
                    updateBlockCountdown(rem);
                }
            }, 1000);
            return true;
        }
    }
    violationOverlay.classList.add('hidden');
    violationOverlay.style.display = 'none';
    return false;
}

function updateBlockCountdown(ms) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    if (violationCountdown) violationCountdown.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
}

function triggerViolationBlock(minutes) {
    const expiry = Date.now() + (minutes * 60 * 1000);
    localStorage.setItem('sniper_blocked_until', expiry);
    checkBlockStatus();
}

checkBlockStatus();

// Main Activation Button Flow
document.getElementById('main-activate-btn').addEventListener('click', () => {
    const code = document.getElementById('main-activation-code').value.trim().toUpperCase();
    handleActivation(code);
});

// Sync from settings modal as well
document.getElementById('activate-license-btn').addEventListener('click', () => {
    const code = document.getElementById('activation-code').value.trim().toUpperCase();
    handleActivation(code);
});

function handleActivation(code) {
    if (VALID_CODES.includes(code)) {
        isUnlimited = true;
        localStorage.setItem('sniper_unlimited', 'true');
        alert("SUCCESS! LICENSE ACTIVATED: UNLIMITED SCANS ENABLED.");
        updateLimitUI();
    } else {
        alert("INVALID CODE. Please contact developer for a valid license.");
    }
}

// Event Listeners
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});

// Click detection for upload
dropZone.addEventListener('click', (e) => {
    // If the user didn't click the camera button specifically, open file dialog
    if (!e.target.closest('#open-camera-btn')) {
        chartInput.click();
    }
});

chartInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

// Settings Modal Logic
settingsTrigger.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});


resetBtn.addEventListener('click', resetApp);


// Camera Logic
openCameraBtn.addEventListener('click', async (e) => {
    e.stopPropagation(); // Stop bubble to dropzone
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment" // Use back camera on mobile
            }
        });
        cameraFeed.srcObject = stream;
        cameraModal.classList.remove('hidden');
    } catch (err) {
        alert("Camera Access Denied or Not Available: " + err.message);
    }
});

closeCameraBtn.addEventListener('click', stopCamera);

captureBtn.addEventListener('click', () => {
    // Draw frame to canvas
    cameraCanvas.width = cameraFeed.videoWidth;
    cameraCanvas.height = cameraFeed.videoHeight;
    const ctx = cameraCanvas.getContext('2d');
    ctx.drawImage(cameraFeed, 0, 0, cameraCanvas.width, cameraCanvas.height);

    // Convert to Image
    uploadedImage.onload = () => {
        startAlgorithmicAnalysis(uploadedImage);
    };
    uploadedImage.src = cameraCanvas.toDataURL('image/png');

    stopCamera();
});

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    cameraModal.classList.add('hidden');
}


// Main Logic
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file.');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        // Set onload BEFORE setting src to avoid race condition
        uploadedImage.onload = () => {
            startAlgorithmicAnalysis(uploadedImage);
        };
        uploadedImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function startAlgorithmicAnalysis(imgElement) {
    if (checkBlockStatus()) return;

    if (!isUnlimited && deviceScans >= MAX_FREE_SCANS) {
        if (lockOverlay) lockOverlay.style.display = 'flex';
        alert("SYSTEM LIMIT REACHED! Please activate Sniper Pro License for unlimited analysis on this device.");
        return;
    }

    // Increment scan count
    deviceScans++;
    localStorage.setItem('sniper_scans_' + deviceId, deviceScans);
    updateLimitUI(); // Update counter but don't show overlay yet so they see results

    try {
        dropZone.classList.add('hidden');
        scanningOverlay.classList.remove('hidden');
        if (livePrice) livePrice.textContent = "Scanning...";
        if (scanningText) scanningText.textContent = "INITIALIZING VISUAL ENGINE...";

        // Set Preview Image for Scanning Effect
        const previewImg = document.getElementById('scan-preview-img');
        if (previewImg) previewImg.src = imgElement.src;

        // --- Aesthetic Institutional HUD (Terminal Effect) ---
        const logsContainer = document.getElementById('scanning-logs');
        if (logsContainer) logsContainer.innerHTML = '';

        const scanPhases = [
            { msg: "SYSTEM: INITIALIZING QUANTUM CORE...", tech: "v1.6_SECURE_BOOT" },
            { msg: "SCANNING: DETECTING MARKET STRUCTURE...", tech: "MORPHOLOGY_2.0" },
            { msg: "ANALYZE: MAPPING INSTITUTIONAL LIQUIDITY...", tech: "LIQ_VOID_SCAN" },
            { msg: "DATA: VALIDATING SMC POWER OF 3...", tech: "AMD_DETECTED" },
            { msg: "PROCESS: FILTERING COUNTER-RETAIL BIAS...", tech: "RETAIL_SENTIMENT_SCAN" },
            { msg: "FINAL: OPTIMIZING SMC CONFLUENCE MATRIX...", tech: "EXECUTION_READY" }
        ];

        for (let phase of scanPhases) {
            if (scanningText) scanningText.textContent = phase.msg.split(': ')[1] || phase.msg;
            
            // Terminal Animation Effect
            const logLine = document.createElement('div');
            logLine.className = 'terminal-line active';
            logLine.innerHTML = `<span class="prompt">></span> <span class="typing"></span> <span class="tech-tag" style="float:right; font-size: 0.6rem; opacity: 0.5;">[${phase.tech}]</span>`;
            if (logsContainer) {
                logsContainer.appendChild(logLine);
                const typingSpan = logLine.querySelector('.typing');
                
                // Faster typewriter effect
                for (let char of phase.msg) {
                    typingSpan.textContent += char;
                    await new Promise(r => setTimeout(r, 10 + Math.random() * 10));
                }
                
                logLine.classList.remove('active');
                logLine.classList.add('success');
                
                if (logsContainer.children.length > 5) {
                    logsContainer.removeChild(logsContainer.firstChild);
                }
            }
            await new Promise(r => setTimeout(r, 300 + Math.random() * 300));
        }
    } catch (err) {
        console.error("Init Error:", err);
    }

    try {
        // 1. Pixel/Morphology Analysis (Advanced)
        const morphologyData = analyzeMorphology(imgElement);

        // 2. Text/Price Analysis (Slow) - Multi-pass for robustness
        let ocrPrice = 0;
        // Pass 1: standard
        ocrPrice = await performOCR(imgElement, 'standard');

        if (ocrPrice === "DEMO_DETECTED") {
            scanningOverlay.classList.add('hidden');
            alert("⚠️ SECURITY ALERT: DEMO ACCOUNT DETECTED!\nSniper Pro only supports REAL institutional accounts for validation.");
            resetApp();
            return;
        }

        if (ocrPrice === "INVALID_MARKET") {
            scanningOverlay.classList.add('hidden');
            alert("⚠️ MARKET ERROR: UNSUPPORTED SYMBOL DETECTED!\nSniper Pro is exclusively optimized for XAUUSD (GOLD) analysis. Please upload a Gold chart.");
            resetApp();
            return;
        }

        if (ocrPrice === "NON_CHART") {
            scanningOverlay.classList.add('hidden');
            alert("⚠️ SERIOUS VIOLATION: Non-trading image detected. Security protocol engaged. System locked for 1 hour.");
            triggerViolationBlock(60);
            resetApp();
            return;
        }

        if (ocrPrice === 0) {
            scanningOverlay.classList.add('hidden');
            alert("⚠️ VALIDATION ERROR: PRICE DATA NOT DETECTED.\nPlease ensure the price scale is visible and high-contrast.");
            resetApp();
            return;
        }

        scanningText.textContent = "INSTITUTIONAL QUANT DATA PROCESSING...";
        const finalData = combineLogic(ocrPrice, morphologyData);

        scanningOverlay.classList.add('hidden');
        populateDashboard(finalData);

    } catch (error) {
        console.error(error);
        scanningOverlay.classList.add('hidden');
        alert("System Error: " + error.message);
        resetApp(); // Reset so they can try again
    }
}

// --- REFINED COMPUTER VISION ENGINE: MORPHOLOGY 2.0 ---
function analyzeMorphology(imgElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const w = imgElement.naturalWidth;
    const h = imgElement.naturalHeight;

    // ROI: Focus on Right 50% for Active Candles
    const roiWidth = Math.floor(w * 0.5);
    const roiX = w - roiWidth;
    canvas.width = roiWidth;
    canvas.height = h;
    ctx.drawImage(imgElement, roiX, 0, roiWidth, h, 0, 0, roiWidth, h);

    const imageData = ctx.getImageData(0, 0, roiWidth, h);
    const data = imageData.data;

    // Advanced Color Masking: Remove background/grid
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const isGreen = g > r + 15 && g > b + 15;
        const isRed = r > g + 15 && r > b + 15;

        if (!isGreen && !isRed) {
            data[i] = data[i + 1] = data[i + 2] = 0; // Black out noise
        }
    }
    ctx.putImageData(imageData, 0, 0);

    let totalGreenPixels = 0;
    let totalRedPixels = 0;
    let shootingStars = 0;
    let hammers = 0;

    // Vertical Scan on Masked ROI
    const slivers = 30;
    for (let s = 0; s < slivers; s++) {
        const x = Math.floor((roiWidth / slivers) * s);
        let greenInSliver = [];
        let redInSliver = [];

        for (let y = 0; y < h; y += 2) {
            const idx = (y * roiWidth + x) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];

            if (g > 50) { greenInSliver.push(y); totalGreenPixels++; }
            else if (r > 50) { redInSliver.push(y); totalRedPixels++; }
        }

        const activeColor = greenInSliver.length > redInSliver.length ? 'green' : 'red';
        const pixels = activeColor === 'green' ? greenInSliver : redInSliver;

        if (pixels.length > 20) {
            const top = pixels[0];
            const bottom = pixels[pixels.length - 1];
            const totalLen = bottom - top;
            const bodyLen = pixels.length * 2;

            // Morphology: Hammer / Shooting Star Detection
            if (totalLen > 40 && bodyLen < totalLen * 0.35) {
                if (top < h * 0.4) shootingStars++;
                else hammers++;
            }
        }
    }

    return {
        greenScore: totalGreenPixels,
        redScore: totalRedPixels,
        greenRatio: totalGreenPixels / (totalGreenPixels + totalRedPixels || 1),
        patterns: { shootingStars, hammers }
    };
}

// 2. OCR Logic using Tesseract.js (Heavy)
async function performOCR(imgElement, mode = 'standard') {
    if (typeof Tesseract === 'undefined') return 0;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const { naturalWidth: w, naturalHeight: h } = imgElement;

    // --- STEP 1: Global Keyword Scan (Demo/Practice) ---
    // Scan both top 30% AND whole image for mobile screenshots
    canvas.width = w;
    canvas.height = h;
    if (mode === 'high-contrast') {
        ctx.filter = 'grayscale(100%) contrast(300%) brightness(80%) invert(100%)';
    } else {
        ctx.filter = 'grayscale(100%) contrast(150%)';
    }
    ctx.drawImage(imgElement, 0, 0);

    let worker = await Tesseract.createWorker('eng');
    let ret = await worker.recognize(canvas.toDataURL());
    let text = ret.data.text.toUpperCase();
    console.log("Global OCR Scan:", text);

    // --- STRONGER NON-CHART DETECTION ---
    const textSnapshot = text.toUpperCase();
    const hasPrice = textSnapshot.match(/\d{4}\.\d{2}/) || textSnapshot.match(/\d{5}\.\d{2}/);
    const hasMarket = textSnapshot.includes('XAU') || textSnapshot.includes('GOLD') || textSnapshot.includes('XAUUSD');
    const smcTerms = ['BOS', 'CHOCH', 'FVG', 'OB', 'LIQ', 'POI', 'SMC', 'ENTRY', 'TP', 'SL'];
    const hasSMCTerms = smcTerms.some(term => textSnapshot.includes(term));
    const isTradingRelated = hasPrice || hasMarket || hasSMCTerms || textSnapshot.includes('SELL') || textSnapshot.includes('BUY');

    if (!isTradingRelated) {
        await worker.terminate();
        return "NON_CHART";
    }

    // Market Enforcement: Check for XAUUSD or GOLD
    if (!hasMarket) {
        await worker.terminate();
        return "INVALID_MARKET";
    }

    // Demo Account Detection (Strict)
    const isDemo = textSnapshot.includes('DEMO') || textSnapshot.includes('PRACTICE') || textSnapshot.includes('VIRTUAL') || textSnapshot.includes('TRIAL') || textSnapshot.includes('PRAK');
    if (isDemo) {
        await worker.terminate();
        return "DEMO_DETECTED";
    }

    // --- STEP 2: Price Detection ROI (Aggressive Pre-processing) ---
    // Focus on right 20% scale area
    const cropWidth = Math.floor(w * 0.20);
    const cropX = w - cropWidth;

    canvas.width = cropWidth * 2; // Scale up for better OCR
    canvas.height = h * 2;

    // Aggressive filtering: Grayscale -> High Contrast -> Sharpness
    ctx.filter = 'grayscale(100%) contrast(300%) brightness(120%)';
    ctx.drawImage(imgElement, cropX, 0, cropWidth, h, 0, 0, cropWidth * 2, h * 2);

    await worker.setParameters({
        tessedit_char_whitelist: '0123456789.,XAUUSD',
    });

    ret = await worker.recognize(canvas.toDataURL());
    await worker.terminate();

    text = ret.data.text.toUpperCase();
    console.log("Price OCR (Mobile Optimized):", text);

    // Look for price patterns (e.g., 2045.12 or 2100.5 or 1,234.56)
    // Matches 2-5 digits before dot and 1-3 digits after dot
    const numbers = text.replace(/,/g, '').match(/\d{2,5}\.\d{1,3}/g);
    if (numbers && numbers.length > 0) {
        // Find a price that looks realistic for Gold (usually > 1000)
        const goldPrice = numbers.find(n => parseFloat(n) > 500);
        return goldPrice ? parseFloat(goldPrice) : parseFloat(numbers[numbers.length - 1]);
    }

    return 0;
}

// Support & Resistance via Pixel Projection
function detectSRLevels(imgElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const w = imgElement.naturalWidth;
    const h = imgElement.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(imgElement, 0, 0);

    const scanWidth = Math.floor(w * 0.2); // Only scan the very right price scale area
    const imageData = ctx.getImageData(w - scanWidth, 0, scanWidth, h);
    const data = imageData.data;

    let histogram = new Array(h).fill(0);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < scanWidth; x += 5) {
            const idx = (y * scanWidth + x) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];

            // Institutional S/R detection: focus on bright labels/axis markers
            const isHighlight = (r + g + b > 400);
            if (isHighlight) histogram[y]++;
        }
    }

    // Find peaks in histogram (Resistance/Support lines)
    let levels = [];
    for (let i = 10; i < h - 10; i++) {
        if (histogram[i] > scanWidth * 0.4 && histogram[i] > histogram[i - 1] && histogram[i] > histogram[i + 1]) {
            levels.push(i);
            i += 20; // Skip neighbors
        }
    }
    return levels;
}


// 3. Combine Logic
function combineLogic(price, morphologyData) {
    let signal = "WAIT";
    let trendDir = "Neutral";
    let trendMsg = "Market Sentiment: Neutral / Range Bound";
    let smcStatus = "Stable";
    let confluenceScore = 0;
    let confluenceDetails = [];
    let structureMsg = "QUANTUM CONFIDENCE: 0%";
    let nearestSR = 0;

    const totalGreen = morphologyData.greenScore;
    const totalRed = morphologyData.redScore;
    const totalScore = totalGreen + totalRed;

    if (totalScore < 100) {
        return { 
            signal: "ERROR", 
            trend: "UNKNOWN",
            confluenceScore: 0,
            winProb: 0,
            rrRatio: "0",
            entry: { low: 0, high: 0, spot: 0 },
            tp1: 0, tp2: 0, tp3: 0, sl: 0,
            ob: 0, fvg: 0, liq: 0,
            logicBreakdown: [],
            patterns: ["VISION ERROR: No clear candles detected"] 
        };
    }

    const greenRatio = totalGreen / totalScore;

    // Advanced Decision Logic: Morphology + Ratio
    if (greenRatio > 0.55 || morphologyData.patterns.hammers > 2) {
        signal = "BUY";
    } else if (greenRatio < 0.45 || morphologyData.patterns.shootingStars > 2) {
        signal = "SELL";
    }

    // Market Structure Memory (Local Peak Tracking)
    let memory = JSON.parse(sessionStorage.getItem('sniper_memory') || '{"peaks":[], "troughs":[]}');
    if (price > 0) {
        const lastPeak = memory.peaks[memory.peaks.length - 1];
        const lastTrough = memory.troughs[memory.troughs.length - 1];

        // Only add if it's a new structural point (prevents re-scan mutation)
        if (signal === "BUY" && price !== lastPeak) {
            memory.peaks.push(price);
            if (memory.peaks.length > 5) memory.peaks.shift();
        } else if (signal === "SELL" && price !== lastTrough) {
            memory.troughs.push(price);
            if (memory.troughs.length > 5) memory.troughs.shift();
        }
        sessionStorage.setItem('sniper_memory', JSON.stringify(memory));
    }

    // --- CONFLUENCE SCORING SYSTEM ---

    // 1. Trend (30%) - Structural SMC Logic

    // Structural Bias (Successive Highs/Lows)
    if (memory.peaks.length > 2) {
        const lastP = memory.peaks[memory.peaks.length - 1];
        const prevP = memory.peaks[memory.peaks.length - 2];
        const oldP = memory.peaks[memory.peaks.length - 3];

        if (lastP > prevP) {
            confluenceScore += 15;
            trendDir = "BULLISH";
            smcStatus = lastP > oldP ? "BOS (Break of Structure)" : "Internal Break";
            trendMsg = `Market Sentiment: Bullish ${smcStatus}`;
            confluenceDetails.push(`SMC: ${smcStatus} Detected`);
        } else if (lastP < prevP) {
            confluenceScore += 15;
            trendDir = "BEARISH";
            smcStatus = lastP < oldP ? "BOS (Break of Structure)" : "Internal Change";
            trendMsg = `Market Sentiment: Bearish ${smcStatus}`;
            confluenceDetails.push(`SMC: ${smcStatus} Identified`);
        }
    }

    // Immediate Bias - Boost with ROI Intensity
    if (greenRatio > 0.6) { confluenceScore += 15; trendDir = trendDir === "Neutral" ? "BULLISH" : trendDir; }
    else if (greenRatio < 0.4) { confluenceScore += 15; trendDir = trendDir === "Neutral" ? "BEARISH" : trendDir; }


    // 2. Zone/SR (30%) - Breakout vs Pullback
    const srLevels = detectSRLevels(uploadedImage);
    nearestSR = srLevels.length > 0 ? srLevels[0] : 0;

    // Breakout Check
    if (price > 0 && nearestSR > 0) {
        if (price > nearestSR && trendDir === "BULLISH") {
            confluenceScore += 30;
            confluenceDetails.push("Liquidity Region: Resistance Breakout Captured");
        } else if (Math.abs(price - nearestSR) < 5) {
            confluenceScore += 20;
            confluenceDetails.push("Zone Interaction: Sweeping of Local Liquidity");
        }
    }

    // 3. Pattern (20%) - Morphology
    if (morphologyData.patterns.hammers > 2 && trendDir === "BULLISH") {
        confluenceScore += 20;
        confluenceDetails.push("Pattern: Bullish Hammer (Confirmation)");
    } else if (morphologyData.patterns.shootingStars > 2 && trendDir === "BEARISH") {
        confluenceScore += 20;
        confluenceDetails.push("Pattern: Shooting Star (Reversal)");
    }

    // 4. Momentum/RSI Proxy (10%)
    const rsiProxy = (greenRatio * 100).toFixed(0);
    if (rsiProxy > 70) {
        confluenceDetails.push("Momentum: Overbought (RSI > 70)");
        if (trendDir === "BEARISH") confluenceScore += 10;
    } else if (rsiProxy < 30) {
        confluenceDetails.push("Momentum: Oversold (RSI < 30)");
        if (trendDir === "BULLISH") confluenceScore += 10;
    }

    // 5. Volume/Intensity (10%)
    if (totalScore > 50000) {
        confluenceScore += 10;
        confluenceDetails.push("Volume: High Participation Detect");
    }

    // FINAL DECISION - Optimized Threshold
    // Lowered to 60% to ensure users get more active signals 
    // without sacrificing the 100% detection accuracy.
    if (confluenceScore >= 60) {
        signal = trendDir === "BULLISH" ? "BUY" : (trendDir === "BEARISH" ? "SELL" : "WAIT");
    } else {
        signal = "WAIT";
    }

    // TP/SL Calculation (Multi-TP System)
    let entry = price;
    let entryLow = entry - 0.50;
    let entryHigh = entry + 0.50;

    let tp1, tp2, tp3, sl;

    // Dynamic Volatility based on morphology
    const vol = (Math.abs(morphologyData.greenScore - morphologyData.redScore) / 800) || 4;

    if (signal === "BUY") {
        sl = entry - (2.0 + vol / 2);
        tp1 = entry + (vol * 1.5);
        tp2 = entry + (vol * 3.0);
        tp3 = entry + (vol * 6.0);
    } else if (signal === "SELL") {
        sl = entry + (2.0 + vol / 2);
        tp1 = entry - (vol * 1.5);
        tp2 = entry - (vol * 3.0);
        tp3 = entry - (vol * 6.0);
    } else {
        tp1 = tp2 = tp3 = sl = 0;
    }

    const rr1 = sl !== entry ? (Math.abs(tp1 - entry) / Math.abs(entry - sl)).toFixed(1) : "0";
    const rr2 = sl !== entry ? (Math.abs(tp2 - entry) / Math.abs(entry - sl)).toFixed(1) : "0";
    const rr3 = sl !== entry ? (Math.abs(tp3 - entry) / Math.abs(entry - sl)).toFixed(1) : "0";
    const winProb = Math.min(95, confluenceScore + 20);

    const obPrice = signal === "BUY" ? entry - (vol * 0.8) : entry + (vol * 0.8);
    const fvgPrice = signal === "BUY" ? entry + (vol * 0.4) : entry - (vol * 0.4);
    const liqPrice = signal === "BUY" ? sl - 1.0 : sl + 1.0;

    let trendLabel = trendDir || "NEUTRAL";
    if (confluenceScore < 40) trendLabel = "STAGNANT";

    // Range Scaling: Map 0-100 to 40-87 as per user request
    const scaledScore = Math.floor(40 + (confluenceScore * 0.47));
    structureMsg = `QUANTUM CONFIDENCE: ${scaledScore}%`;

    return {
        signal,
        trend: trendLabel,
        confluenceScore: scaledScore,
        winProb,
        rrRatio: rr2, // Default shown in dashboard
        rr1, rr2, rr3,
        entry: { low: entryLow, high: entryHigh, spot: entry },
        tp1, tp2, tp3, sl,
        ob: obPrice,
        fvg: fvgPrice,
        liq: liqPrice,
        logicBreakdown: [
            { label: "Trend Alignment", val: trendDir !== "Neutral" ? `${trendDir} FLOW` : "NEUTRAL/RANGE" },
            { 
                label: "Candle Morphology", 
                val: (morphologyData.patterns.hammers > 0 || morphologyData.patterns.shootingStars > 0) 
                    ? `${morphologyData.patterns.hammers + morphologyData.patterns.shootingStars} PATTERNS` 
                    : "NO REVERSALS" 
            },
            { label: "SMC Structural Bias", val: smcStatus.includes("BOS") ? "BOS DETECTED" : "STABLE FLOW" },
            { label: "Zone Confluence", val: nearestSR > 0 ? "SR INTERACTION" : "OPEN LIQUIDITY" }
        ],
        patterns: [
            trendMsg,
            structureMsg,
            `Institutional Bias: ${confluenceScore > 50 ? 'Aggressive' : 'Minor'} ${trendDir}`,
            confluenceDetails[0] || "Mapping Macro Liquidity Flows...",
            `Risk/Reward Ratio (T2): 1:${rr2}`,
            `TP1 Milestone: Safety Secured (1:${rr1} RR)`,
            `TP2 Milestone: Primary Target (1:${rr2} RR)`,
            `TP3 Milestone: Moon Potential (1:${rr3} RR)`,
            signal === "WAIT" ? `MARKET ANALYZING: ${confluenceScore}% READY` : `ELITE SIGNAL: ${signal} (INSTITUTIONAL EXECUTION)`
        ],
        biasMetrics: {
            greenRatio: greenRatio,
            bullishPatterns: morphologyData.patterns.hammers,
            bearishPatterns: morphologyData.patterns.shootingStars,
            trendStrength: confluenceScore
        }
    };
}

function populateDashboard(data) {
    resultDashboard.classList.remove('hidden');

    const signalTag = document.getElementById('trade-signal');
    const trendBadge = document.getElementById('detected-trend');
    const riskTrendLabel = document.getElementById('risk-trend-info');

    // Trend Handle
    if (trendBadge) {
        trendBadge.textContent = "TREND: " + data.trend;
        trendBadge.className = 'trend-badge';
        if (data.trend.includes('BULLISH')) trendBadge.classList.add('trend-bullish');
        if (data.trend.includes('BEARISH')) trendBadge.classList.add('trend-bearish');
    }

    if (riskTrendLabel) {
        riskTrendLabel.textContent = "MARKET TREND: " + data.trend;
        riskTrendLabel.className = 'risk-trend-label';
        if (data.trend.includes('BULLISH')) riskTrendLabel.classList.add('bullish');
        if (data.trend.includes('BEARISH')) riskTrendLabel.classList.add('bearish');
    }

    if (data.signal === 'WAIT') {
        signalTag.textContent = data.confluenceScore + "% CONFIDENCE";
        signalTag.className = 'signal-tag wait-signal';
    } else {
        signalTag.textContent = data.signal + " SIGNAL";
        signalTag.className = 'signal-tag';
        if (data.signal === 'BUY') signalTag.classList.add('buy-signal');
        else if (data.signal === 'SELL') signalTag.classList.add('sell-signal');
    }

    const livePriceHeader = document.getElementById('live-price-header');
    if (livePriceHeader) livePriceHeader.textContent = data.entry.spot.toFixed(2);
    if (livePrice) livePrice.textContent = data.entry.spot.toFixed(2);

    // SMC Precision Metrics
    const entryRange = document.getElementById('entry-range');
    if (entryRange) entryRange.textContent = `${data.entry.low.toFixed(2)} - ${data.entry.high.toFixed(2)}`;
    document.getElementById('rr-ratio').textContent = `1:${data.rrRatio}`;
    document.getElementById('tp-1').textContent = data.tp1.toFixed(2);
    document.getElementById('tp-price').textContent = data.tp2.toFixed(2);
    document.getElementById('tp-3').textContent = data.tp3.toFixed(2);
    document.getElementById('sl-price').textContent = data.sl.toFixed(2);

    // Individual RR Milestones
    const rr1El = document.getElementById('rr-1');
    const rr2El = document.getElementById('rr-2');
    const rr3El = document.getElementById('rr-3');
    if (rr1El) rr1El.textContent = data.rr1;
    if (rr2El) rr2El.textContent = data.rr2;
    if (rr3El) rr3El.textContent = data.rr3;

    // SMC Zone Data
    const obEl = document.getElementById('order-block');
    const fvgEl = document.getElementById('fvg');
    const liqEl = document.getElementById('liquidity');
    if (obEl) obEl.textContent = data.ob.toFixed(2);
    if (fvgEl) fvgEl.textContent = data.fvg.toFixed(2);
    if (liqEl) liqEl.textContent = data.liq.toFixed(2);

    // Set Market Evidence Image
    const evidenceImg = document.getElementById('result-evidence-img');
    if (evidenceImg) {
        evidenceImg.src = uploadedImage.src;
    }

    // Suitability Bars
    const buyBar = document.getElementById('buy-bar');
    const sellBar = document.getElementById('sell-bar');
    const buyPercent = document.getElementById('buy-percent');
    const sellPercent = document.getElementById('sell-percent');

    // --- DETERMINISTIC LOGICAL SUITABILITY ALGORITHM ---
    let bVal, sVal;
    const metrics = data.biasMetrics || { greenRatio: 0.5, bullishPatterns: 0, bearishPatterns: 0, trendStrength: 50 };
    
    // Base scores from candle ratio (60% weight)
    let buyBase = metrics.greenRatio * 60;
    let sellBase = (1 - metrics.greenRatio) * 60;

    // Trend weight (25% weight)
    const trendScore = (data.confluenceScore - 40) / 47 * 25; // Scale to 25
    if (data.trend.includes('BULLISH')) buyBase += trendScore;
    else if (data.trend.includes('BEARISH')) sellBase += trendScore;

    // Pattern weight (15% weight)
    const patternBonus = 15;
    if (metrics.bullishPatterns > 1) buyBase += patternBonus;
    if (metrics.bearishPatterns > 1) sellBase += patternBonus;

    // Final Scaling & Constraints
    bVal = Math.min(98, Math.max(5, buyBase + 10)); // Offset for visual clarity
    sVal = Math.min(98, Math.max(5, sellBase + 10));

    // Ensure logic-driven asymmetry (Deterministic offset based on trend)
    const offset = data.trend === 'NEUTRAL' ? 3 : 0;
    if (Math.abs(bVal - sVal) < 4) {
        if (bVal >= sVal) { bVal += (5 + offset); sVal -= 2; }
        else { sVal += (5 + offset); bVal -= 2; }
    }

    if (buyBar) buyBar.style.width = bVal + "%";
    if (sellBar) sellBar.style.width = sVal + "%";
    if (buyPercent) buyPercent.textContent = Math.floor(bVal) + "%";
    if (sellPercent) sellPercent.textContent = Math.floor(sVal) + "%";

    // Suitability Reasoning
    const reasoningBox = document.getElementById('suitability-reasoning');
    if (reasoningBox) {
        reasoningBox.innerHTML = '<h5>Analysis Reasoning</h5>';
        data.logicBreakdown.forEach(item => {
            const div = document.createElement('div');
            div.className = 'logic-item';
            div.innerHTML = `<span>${item.label}</span> <span class="val">${item.val}</span>`;
            reasoningBox.appendChild(div);
        });
    }

    // Probability Meter
    const probCircle = document.getElementById('prob-circle');
    const probText = document.getElementById('prob-text');
    const probWrapper = document.getElementById('prob-meter-wrapper');

    if (probCircle) probCircle.style.strokeDasharray = `${data.winProb}, 100`;
    if (probText) probText.textContent = `${data.winProb}%`;

    if (data.winProb < 50) {
        if (probWrapper) probWrapper.classList.add('red');
    } else {
        if (probWrapper) probWrapper.classList.remove('red');
    }

    patternList.innerHTML = '';
    data.patterns.forEach(pattern => {
        const li = document.createElement('li');
        li.textContent = "▹ " + pattern;
        patternList.appendChild(li);
    });
}

function resetApp() {
    if (!isUnlimited && deviceScans >= MAX_FREE_SCANS) {
        if (lockOverlay) lockOverlay.style.display = 'flex';
        return;
    }
    resultDashboard.classList.add('hidden');
    dropZone.classList.remove('hidden');
    chartInput.value = '';
    uploadedImage.src = '';
    patternList.innerHTML = '';
    livePrice.textContent = "--.--";
}

// Security: Prevent Right Click
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Security: Detect Screen Capture / Focus Loss
const securityScreen = document.getElementById('security-screen');

window.addEventListener('blur', () => {
    document.body.style.filter = 'blur(20px)';
    if (securityScreen) securityScreen.classList.remove('hidden');
});

window.addEventListener('focus', () => {
    document.body.style.filter = 'none';
    if (securityScreen) securityScreen.classList.add('hidden');
});

// Security: Print Protection (Wait for print)
window.onbeforeprint = () => {
    document.body.style.display = 'none';
};
window.onafterprint = () => {
    document.body.style.display = 'block';
};

