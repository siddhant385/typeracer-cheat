document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const speedInput = document.getElementById('speed');
    const speedSlider = document.getElementById('speedSlider');
    const errorRateInput = document.getElementById('errorRate');
    const errorRateSlider = document.getElementById('errorRateSlider');
    const autoSubmit = document.getElementById('autoSubmit');
    const humanizedTyping = document.getElementById('humanizedTyping');
    const burstMode = document.getElementById('burstMode');
    const ocrApiKey = document.getElementById('ocrApiKey');
    const saveBtn = document.getElementById('save');
    const resetBtn = document.getElementById('reset');
    const statusEl = document.getElementById('status');

    // Stats elements
    const currentWpm = document.getElementById('currentWpm');
    const currentAccuracy = document.getElementById('currentAccuracy');
    const raceCount = document.getElementById('raceCount');

    const DEFAULTS = {
        speed: 80,
        errorRate: 2,
        autoSubmit: false,
        humanizedTyping: true,
        burstMode: false,
        ocrApiKey: '',
        stats: { races: 0, bestWpm: 0, totalWords: 0 }
    };

    // Function to update UI from data object
    function updateUI(data) {
        speedInput.value = data.speed;
        speedSlider.value = data.speed;
        errorRateInput.value = data.errorRate;
        errorRateSlider.value = data.errorRate;
        autoSubmit.checked = data.autoSubmit;
        humanizedTyping.checked = data.humanizedTyping;
        burstMode.checked = data.burstMode;
        ocrApiKey.value = data.ocrApiKey;

        // Update stats
        const targetWpm = Math.round(60000 / data.speed);
        currentWpm.textContent = targetWpm;
        
        const accuracy = Math.max(95, 100 - data.errorRate);
        currentAccuracy.textContent = accuracy + '%';
        
        raceCount.textContent = data.stats?.races || 0;
    }

    // Function to show status message
    function showStatus(message, type = 'success') {
        statusEl.textContent = message;
        statusEl.className = `status-${type}`;
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = '';
        }, 3000);
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
            humanizedTyping: humanizedTyping.checked,
            burstMode: burstMode.checked,
            ocrApiKey: ocrApiKey.value.trim()
        };

        // Validation
        if (newSettings.speed < 10 || newSettings.speed > 200) {
            showStatus('⚠️ Speed must be between 10-200ms', 'error');
            return;
        }

        if (newSettings.errorRate < 0 || newSettings.errorRate > 100) {
            showStatus('⚠️ Error rate must be between 0-100%', 'error');
            return;
        }

        chrome.storage.local.set(newSettings, () => {
            showStatus('✅ Settings saved successfully!', 'success');
            updateUI(newSettings);
        });
    });

    // Reset settings to default
    resetBtn.addEventListener('click', () => {
        if (confirm('🔄 Reset all settings to default values?')) {
            chrome.storage.local.set(DEFAULTS, () => {
                updateUI(DEFAULTS);
                showStatus('🔄 Settings reset to default', 'success');
            });
        }
    });
    
    // Sync sliders with number inputs
    speedSlider.addEventListener('input', (e) => {
        speedInput.value = e.target.value;
        const wpm = Math.round(60000 / e.target.value);
        currentWpm.textContent = wpm;
    });
    
    speedInput.addEventListener('input', (e) => {
        speedSlider.value = e.target.value;
        const wpm = Math.round(60000 / e.target.value);
        currentWpm.textContent = wpm;
    });
    
    errorRateSlider.addEventListener('input', (e) => {
        errorRateInput.value = e.target.value;
        const accuracy = Math.max(95, 100 - e.target.value);
        currentAccuracy.textContent = accuracy + '%';
    });
    
    errorRateInput.addEventListener('input', (e) => {
        errorRateSlider.value = e.target.value;
        const accuracy = Math.max(95, 100 - e.target.value);
        currentAccuracy.textContent = accuracy + '%';
    });

    // Initial load
    loadSettings();

    // Update stats every 5 seconds if popup is open
    setInterval(() => {
        chrome.storage.local.get(['stats'], (data) => {
            if (data.stats) {
                raceCount.textContent = data.stats.races || 0;
            }
        });
    }, 5000);
});