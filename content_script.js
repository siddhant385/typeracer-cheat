(async function () {
    // ===================================================================================
    // SELECTORS (Change karne ke liye yahan edit karein)
    // ===================================================================================
    const SELECTORS = {
        WORDS_CONTAINER: ".hideableWords.unselectable",
        TEXT_INPUT: ".txtInput",
        COUNTDOWN_POPUP: ".countdownPopup.horizontalCountdownPopup",
        OCR_CONTAINER: ".bodyWidgetHolder",
        CHALLENGE_TEXTAREA: ".challengeTextArea",
        SUBMIT_BUTTON: ".gwt-Button"
    };

    // ===================================================================================
    // CORE VARIABLES
    // ===================================================================================
    let elementGone = false;
    let wordObserver = null;
    let isTyping = false;
    let typingStats = { wordsTyped: 0, errorsIntentional: 0, totalChars: 0 };
    let config = {
        speed: 80,
        errorRate: 2,
        autoSubmit: false,
        ocrApiKey: "K88541616888957",
        humanizedTyping: true,
        burstMode: false
    };

    // ===================================================================================
    // SETTINGS LOADER
    // ===================================================================================
    function loadConfigFromStorage() {
        return new Promise((resolve) => {
            chrome.storage?.local.get([
                "speed", "errorRate", "autoSubmit", "ocrApiKey", 
                "humanizedTyping", "burstMode"
            ], (data) => {
                config.speed = data.speed ?? config.speed;
                config.errorRate = data.errorRate ?? config.errorRate;
                config.autoSubmit = data.autoSubmit ?? config.autoSubmit;
                config.ocrApiKey = data.ocrApiKey || config.ocrApiKey;
                config.humanizedTyping = data.humanizedTyping ?? config.humanizedTyping;
                config.burstMode = data.burstMode ?? config.burstMode;
                console.log("⚙️ Loaded Config:", config);
                resolve();
            });
        });
    }

    // ===================================================================================
    // UTILITY FUNCTIONS (Sleep, Wait)
    // ===================================================================================
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function waitFor(selector, intervalTime = 300) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const el = document.querySelector(selector);
                if (el) {
                    clearInterval(interval);
                    resolve(el);
                }
            }, intervalTime);
        });
    }

    function waitUntilElementGone(selector, intervalTime = 300) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const el = document.querySelector(selector);
                if (!el) {
                    clearInterval(interval);
                    elementGone = true;
                    console.log(`✅ '${selector}' page se hat gaya`);
                    resolve();
                }
            }, intervalTime);
        });
    }

    // ===================================================================================
    // CORE TYPING LOGIC (Human-like with Enhanced Features)
    // ===================================================================================
    async function typeTextIntoInput(inputEl, text) {
        if (isTyping) {
            console.log("⚠️ Typing pehle se chal rahi hai, isliye skip kar rahe hain...");
            return;
        }
        isTyping = true;
        inputEl.focus();
        inputEl.value = "";
        let index = 0;
        
        // Update stats
        typingStats.wordsTyped++;
        typingStats.totalChars += text.length;

        async function typeNextChar() {
            if (index < text.length) {
                let char = text[index];
                let typo = false;
                let delay = config.speed;

                // Human-like typing patterns
                if (config.humanizedTyping) {
                    // Slower for difficult characters
                    if (/[A-Z]/.test(char)) delay += 30;
                    if (/[!@#$%^&*()_+{}|:"<>?]/.test(char)) delay += 50;
                    
                    // Faster for common words
                    if (['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all'].includes(text.toLowerCase())) {
                        delay -= 20;
                    }
                }

                // Burst mode (occasional fast typing)
                if (config.burstMode && Math.random() < 0.15) {
                    delay = Math.max(delay - 40, 10);
                }

                // Error simulation
                if (Math.random() < config.errorRate / 100) {
                    const wrongChars = "qwertyuiopasdfghjklzxcvbnm";
                    const wrongChar = wrongChars[Math.floor(Math.random() * wrongChars.length)];
                    console.log(`🤕 Galat char '${wrongChar}' type hua`);
                    inputEl.value += wrongChar;
                    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
                    await sleep(200 + Math.random() * 200);
                    inputEl.value = inputEl.value.slice(0, -1);
                    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
                    await sleep(100 + Math.random() * 100);
                    inputEl.value += char;
                    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
                    typo = true;
                    typingStats.errorsIntentional++;
                } else {
                    inputEl.value += char;
                    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
                }

                index++;
                const finalDelay = Math.floor(Math.random() * 70) + delay;
                await sleep(typo ? finalDelay + 200 : finalDelay);
                await typeNextChar();
            } else {
                await sleep(150);
                inputEl.value += " ";
                inputEl.dispatchEvent(new Event("input", { bubbles: true }));
                isTyping = false;
                console.log(`✅ Typing complete! Stats: ${typingStats.wordsTyped} words, ${typingStats.errorsIntentional} errors`);
            }
        }

        await typeNextChar();
    }

    // ===================================================================================
    // OCR (IMAGE TO TEXT) FEATURE LOGIC
    // ===================================================================================
    async function sendToOCR(imgSrc) {
        try {
            const res = await fetch(`https://api.ocr.space/parse/imageurl?apikey=${config.ocrApiKey}&url=${encodeURIComponent(imgSrc)}&OCREngine=5`);
            const data = await res.json();
            if (data.IsErroredOnProcessing) {
                console.error("❌ OCR API Error:", data.ErrorMessage);
                return "";
            }
            return data?.ParsedResults?.[0]?.ParsedText?.trim() || "";
        } catch (err) {
            console.error("❌ OCR API call fail ho gayi:", err);
            return "";
        }
    }

    async function typeIntoTextareaAndSubmit(result) {
        try {
            const textarea = await waitFor(SELECTORS.CHALLENGE_TEXTAREA);
            textarea.focus();
            textarea.value = result;
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
            await sleep(500);

            const submitBtn = document.querySelector(SELECTORS.SUBMIT_BUTTON);
            if (submitBtn && config.autoSubmit) {
                submitBtn.click();
                console.log("✅ OCR result auto-submitted.");
            } else {
                console.log("✅ Text type ho gaya. Submit button ko manually click karein.");
            }
        } catch (err) {
            console.error("❌ OCR result submit karte samay error:", err);
        }
    }

    // ===================================================================================
    // RACE & CHALLENGE MONITORS (MAIN LOGIC)
    // ===================================================================================
    async function startTypingCycle() {
        try {
            console.log("🔄 Naya typing cycle shuru ho raha hai...");
            const wordContainer = await waitFor(SELECTORS.WORDS_CONTAINER);
            const inputBox = await waitFor(SELECTORS.TEXT_INPUT);
            const hiddenSpan = wordContainer.querySelector("span");
            if (!hiddenSpan) throw new Error("❌ Word span nahi mila.");
            elementGone = false;
            console.log("⏳ Countdown khatm hone ka intezaar...");
            await waitUntilElementGone(SELECTORS.COUNTDOWN_POPUP);
            console.log("✅ Countdown khatm, typing shuru.");

            if (wordObserver) wordObserver.disconnect();

            const initialText = hiddenSpan.innerText.trim();
            if (initialText) {
                console.log("📝 Pehla shabd:", initialText);
                await typeTextIntoInput(inputBox, initialText);
            }

            wordObserver = new MutationObserver(() => {
                const newText = hiddenSpan.innerText.trim();
                if (newText && elementGone && !isTyping) {
                    console.log("🔁 Naya shabd mila:", newText);
                    typeTextIntoInput(inputBox, newText);
                }
            });

            wordObserver.observe(hiddenSpan, {
                childList: true,
                characterData: true,
                subtree: true
            });
        } catch (err) {
            console.error("❌ Typing cycle mein error:", err);
        }
    }

    // ===================================================================================
    // OBSERVERS
    // ===================================================================================
    const countdownObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.matches?.(SELECTORS.COUNTDOWN_POPUP)) {
                    console.log("🕒 Naya countdown detect hua!");
                    startTypingCycle();
                }
            });
        });
    });

    const ocrChallengeObserver = new MutationObserver(async (mutations, observer) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && node.querySelector) {
                    const selector = `${SELECTORS.OCR_CONTAINER} img`;
                    const img = node.querySelector(selector);
                    if (img?.src) {
                        console.log("📸 OCR image detect hui!");
                        observer.disconnect();
                        const ocrText = await sendToOCR(img.src);
                        if (ocrText) {
                            console.log("🔤 OCR text:", ocrText);
                            await typeIntoTextareaAndSubmit(ocrText);
                        } else {
                            console.log("🤔 OCR se koi text nahi mila.");
                        }

                        console.log("⏳ 5s baad OCR observer re-enable ho raha hai...");
                        setTimeout(() => {
                            ocrChallengeObserver.observe(document.body, {
                                childList: true,
                                subtree: true
                            });
                            console.log("👀 OCR observer active hai.");
                        }, 5000);
                        return;
                    }
                }
            }
        }
    });

    // ===================================================================================
    // INIT: Load config and start everything
    // ===================================================================================
    await loadConfigFromStorage();
    countdownObserver.observe(document.body, { childList: true, subtree: true });
    ocrChallengeObserver.observe(document.body, { childList: true, subtree: true });
    console.log("🚀 Script chalu ho gaya hai. Race ka intezaar...");
    startTypingCycle();
})();
