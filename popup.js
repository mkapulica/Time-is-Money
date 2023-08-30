const SETTINGS_KEY = 'settings';
const SETTING_NAMES = [
    'monthlyIncome', 
    'weeklyWorkdays', 
    'dailyWorkHours', 
    'dailyCommuteMinutes', 
    'monthlyCommuteCost', 
    'vacationDays',
    'onOffSwitch'
];

function isCheckbox(element) {
    return element.type === 'checkbox';
}

function getSettingValue(settingName) {
    const element = document.getElementById(settingName);
    if (isCheckbox(element)) {
        return element.checked;
    }
    return Number(element.value);
}

function setSettingValue(settingName, value) {
    const element = document.getElementById(settingName);
    if (isCheckbox(element)) {
        element.checked = value;
    } else {
        element.value = value;
    }
}

function gatherSettings() {
    return SETTING_NAMES.reduce((settings, name) => {
        settings[name] = getSettingValue(name);
        return settings;
    }, {});
}

function saveSettingsToStorage(settings) {
    browser.storage.local.set({ [SETTINGS_KEY]: settings }, notifyContentScript);
}

function notifyContentScript() {
    browser.tabs.query({ active: true, currentWindow: true }, tabs => {
        browser.tabs.sendMessage(tabs[0].id, { action: "settingsUpdated" });
    });
}

function applyStoredSettingsToPage() {
    browser.storage.local.get(SETTINGS_KEY, data => {
        if (data[SETTINGS_KEY]) {
            Object.keys(data[SETTINGS_KEY]).forEach(name => {
                setSettingValue(name, data[SETTINGS_KEY][name]);
            });
        }
    });
}

document.getElementById('settingsForm').addEventListener('submit', function(event) {
    // Prevent the form from actually submitting
    event.preventDefault();
  
    const settings = gatherSettings();
    saveSettingsToStorage(settings);
  });

document.addEventListener('DOMContentLoaded', applyStoredSettingsToPage);
