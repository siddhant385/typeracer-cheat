// ===================================================================================
// BACKGROUND SERVICE WORKER - TypeRacer Pro
// ===================================================================================

// Installation and update handlers
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('🎉 TypeRacer Pro installed successfully!');
        
        // Set default settings
        const defaultSettings = {
            speed: 80,
            errorRate: 2,
            autoSubmit: false,
            humanizedTyping: true,
            burstMode: false,
            ocrApiKey: '',
            stats: {
                races: 0,
                bestWpm: 0,
                totalWords: 0,
                totalErrors: 0
            }
        };
        
        chrome.storage.local.set(defaultSettings, () => {
            console.log('✅ Default settings configured');
        });
        
        // Show welcome notification
        chrome.notifications?.create({
            type: 'basic',
            iconUrl: 'icons/Blog.png',
            title: 'TypeRacer Pro Installed!',
            message: 'Click the extension icon to configure your settings and start racing!'
        });
        
    } else if (details.reason === 'update') {
        console.log('🔄 TypeRacer Pro updated to version', chrome.runtime.getManifest().version);
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // Open popup (this is automatic with manifest v3, but we can add custom logic here)
    console.log('🎯 Extension icon clicked on tab:', tab.url);
});

// Message handling between content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case 'updateStats':
            updateUserStats(request.stats);
            sendResponse({ success: true });
            break;
            
        case 'getStats':
            chrome.storage.local.get(['stats'], (data) => {
                sendResponse({ stats: data.stats || {} });
            });
            return true; // Keep message channel open for async response
            
        case 'resetStats':
            const emptyStats = {
                races: 0,
                bestWpm: 0,
                totalWords: 0,
                totalErrors: 0
            };
            chrome.storage.local.set({ stats: emptyStats }, () => {
                sendResponse({ success: true });
            });
            return true;
            
        default:
            console.log('Unknown message type:', request.type);
            sendResponse({ error: 'Unknown message type' });
    }
});

// Update user statistics
function updateUserStats(newStats) {
    chrome.storage.local.get(['stats'], (data) => {
        const currentStats = data.stats || {
            races: 0,
            bestWpm: 0,
            totalWords: 0,
            totalErrors: 0
        };
        
        // Update stats
        const updatedStats = {
            races: currentStats.races + (newStats.raceCompleted ? 1 : 0),
            bestWpm: Math.max(currentStats.bestWpm, newStats.wpm || 0),
            totalWords: currentStats.totalWords + (newStats.wordsTyped || 0),
            totalErrors: currentStats.totalErrors + (newStats.errors || 0)
        };
        
        chrome.storage.local.set({ stats: updatedStats }, () => {
            console.log('📊 Stats updated:', updatedStats);
        });
    });
}

// Periodic cleanup and maintenance
chrome.alarms.create('maintenance', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'maintenance') {
        // Perform periodic cleanup tasks
        console.log('🧹 Performing maintenance tasks...');
        
        // Clear old cache data if any
        chrome.storage.local.get(null, (data) => {
            const size = JSON.stringify(data).length;
            if (size > 1024 * 1024) { // 1MB limit
                console.log('⚠️ Storage getting large, consider cleanup');
            }
        });
    }
});

// Context menu integration (optional)
if (chrome.contextMenus) {
    chrome.contextMenus.create({
        id: 'typeracer-pro-settings',
        title: 'TypeRacer Pro Settings',
        contexts: ['page'],
        documentUrlPatterns: ['https://*.typeracer.com/*']
    });
    
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === 'typeracer-pro-settings') {
            chrome.action.openPopup();
        }
    });
}

// Error handling
chrome.runtime.onSuspend.addListener(() => {
    console.log('🔄 Extension suspending, cleaning up...');
});

console.log('🚀 TypeRacer Pro background service worker loaded successfully!');
