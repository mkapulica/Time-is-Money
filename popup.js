document.getElementById('save').addEventListener('click', function() {
    const settings = {
        monthlyIncome: document.getElementById('monthlyIncome').value,
        weeklyWorkdays: document.getElementById('weeklyWorkdays').value,
        dailyWorkHours: document.getElementById('dailyWorkHours').value,
        dailyCommuteMinutes: document.getElementById('dailyCommuteMinutes').value,
        monthlyCommuteCost: document.getElementById('monthlyCommuteCost').value,
        vacationDays: document.getElementById('vacationDays').value,
        onOff: document.getElementById('onOffSwitch').checked
    };

    // Save settings to browser storage
    browser.storage.local.set({settings: settings}, function() {
        // Send a message to content.js once settings are saved
        browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
            browser.tabs.sendMessage(tabs[0].id, {action: "settingsUpdated"});
        });
    });
});

// Load saved settings when the popup is opened
document.addEventListener('DOMContentLoaded', function() {
    browser.storage.local.get('settings', function(data) {
        if (data.settings) {
            document.getElementById('monthlyIncome').value = data.settings.monthlyIncome;
            document.getElementById('weeklyWorkdays').value = data.settings.weeklyWorkdays;
            document.getElementById('dailyWorkHours').value = data.settings.dailyWorkHours;
            document.getElementById('dailyCommuteMinutes').value = data.settings.dailyCommuteMinutes;
            document.getElementById('monthlyCommuteCost').value = data.settings.monthlyCommuteCost;
            document.getElementById('vacationDays').value = data.settings.vacationDays;
            document.getElementById('onOffSwitch').checked = data.settings.onOff;
        }
    });
});
