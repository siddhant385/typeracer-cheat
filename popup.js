document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const speedInput = document.getElementById('speed');
    const speedSlider = document.getElementById('speedSlider');
    const errorRateInput = document.getElementById('errorRate');
    const errorRateSlider = document.getElementById('errorRateSlider');
    const autoSubmit = document.getElementById('autoSubmit');
    const ocrApiKey = document.getElementById('ocrApiKey');
    const saveBtn = document.getElementById('save');
    const resetBtn = document.getElementById('reset');
    const statusEl = document.getElementById('status');

    const DEFAULTS = {
        speed: 80,
        errorRate: 2,
        autoSubmit: false,
        ocrApiKey: ''
    };

    // Function to update UI from data object
    function updateUI(data) {
        speedInput.value = data.speed;
        speedSlider.value = data.speed;
        errorRateInput.value = data.errorRate;
        errorRateSlider.value = data.errorRate;
        autoSubmit.checked = data.autoSubmit;
        ocrApiKey.value = data.ocrApiKey;
    }
    
    // Load settings from storage
    function loadSettings() {
        chrome.storage.local.get(Object.keys(DEFAULTS), (data) => {
            const currentSettings = { ...DEFAULTS, ...data };
            updateUI(currentSettings);
        });
    }

    // Save settings to storage
    saveBtn.addEventListener('click', () => {
        const newSettings = {
            speed: parseInt(speedInput.value, 10),
            errorRate: parseInt(errorRateInput.value, 10),
            autoSubmit: autoSubmit.checked,
            ocrApiKey: ocrApiKey.value.trim()
        };

        chrome.storage.local.set(newSettings, () => {
            statusEl.textContent = '✅ Settings Saved!';
            statusEl.style.color = '#00e676';
            setTimeout(() => statusEl.textContent = '', 2000);
        });
    });

    // Reset settings to default
    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            chrome.storage.local.set(DEFAULTS, () => {
                updateUI(DEFAULTS);
                statusEl.textContent = '🔄 Settings Reset!';
                statusEl.style.color = '#e0e0e0';
                setTimeout(() => statusEl.textContent = '', 2000);
            });
        }
    });
    
    // Sync sliders with number inputs
    speedSlider.addEventListener('input', (e) => speedInput.value = e.target.value);
    speedInput.addEventListener('input', (e) => speedSlider.value = e.target.value);
    errorRateSlider.addEventListener('input', (e) => errorRateInput.value = e.target.value);
    errorRateInput.addEventListener('input', (e) => errorRateSlider.value = e.target.value);

    // Initial load
    loadSettings();
});