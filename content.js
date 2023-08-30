const PRICE_REGEX = /(?:(?<=\s)|^)(?:(?:[£€$¥₹₽]|Rs\.?)\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{0,2})?|\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{0,2})?\s*(?:[£€$¥₹₽]|Rs\.?))(?:(?=\s)|$)/g;
const CONVERSION_RATES_TO_EUR = {
    '£': 0.85, '€': 1, '$': 0.90, '¥': 0.008, '₹': 0.011, '₽': 0.011, 'Rs': 0.011
};
const DAYS_IN_YEAR = 365.25;
const MONTHS_IN_YEAR = 12.0;
const DAYS_IN_WEEK = 7.0;
const MINUTES_IN_HOUR = 60.0;

let hourWorth = null;

async function refreshHourWorth() {
    hourWorth = await getHourWorthFromStorage();
}

async function getHourWorthFromStorage() {
    return new Promise((resolve, reject) => {
        browser.storage.local.get('settings', data => {
            if (data.settings) {
                resolve(computeHourWorth(data.settings));
            } else {
                reject("No settings found.");
                            }
        });
    });
}

function computeHourWorth(settings) {
    const {
        monthlyIncome, weeklyWorkdays, dailyWorkHours,
        dailyCommuteMinutes, monthlyCommuteCost, vacationDays
    } = settings;

    const monthlyWorkHours = computeMonthlyWorkHours(weeklyWorkdays, dailyWorkHours, dailyCommuteMinutes, vacationDays);
    return (monthlyIncome - monthlyCommuteCost) / monthlyWorkHours;
}

function computeMonthlyWorkHours(weeklyWorkdays, dailyWorkHours, dailyCommuteMinutes, vacationDays) {
    return ((DAYS_IN_YEAR - vacationDays) / MONTHS_IN_YEAR / DAYS_IN_WEEK) * weeklyWorkdays * (dailyWorkHours + (dailyCommuteMinutes / MINUTES_IN_HOUR));
}

function parsePrice(priceStr) {
    const [currencySymbol] = priceStr.match(/[£€$¥₹₽]|Rs\.?/) || [null];
    let cleaned = removeCurrencySymbols(priceStr);
    cleaned = normalizeDelimiters(cleaned);
    return {
        value: parseFloat(cleaned),
        currency: currencySymbol
    };
}

function removeCurrencySymbols(priceStr) {
    return priceStr.replace(/[£€$¥₹₽]|Rs\.?/g, "").trim();
}

function normalizeDelimiters(priceStr) {
    let cleaned = priceStr.replace(/[£€$¥₹₽]|Rs\.?/g, "").trim();

    if (cleaned.includes(".") && cleaned.includes(",")) {
        if (cleaned.lastIndexOf(".") > cleaned.lastIndexOf(",")) {
            // Dot is the decimal, comma is the thousands separator.
            cleaned = cleaned.replace(/,/g, "");
        } else {
            // Comma is the decimal, dot is the thousands separator.
            cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
        }
    } else if (cleaned.includes(",")) {
        if ((cleaned.match(/,/g) || []).length > 1 || cleaned.endsWith(",")) {
            // Comma is the thousands separator.
            cleaned = cleaned.replace(/,/g, "");
        } else {
            // Comma is the decimal separator.
            cleaned = cleaned.replace(/,/g, ".");
        }
    } else if (cleaned.includes(".")) {
        const dotPosition = cleaned.indexOf(".");
        if ((cleaned.match(/\./g) || []).length > 1 || cleaned.endsWith(".") || cleaned.substring(dotPosition + 1).length > 2) {
            // Dot is the thousands separator.
            cleaned = cleaned.replace(/\./g, "");
        }
        // If it's just one dot, not at the end, and less than 3 digits after it, it's a decimal.
    }
    
    return cleaned;
}

function convertToEUR(amount, currency) {
    return amount * (CONVERSION_RATES_TO_EUR[currency] || 1);
}

async function replaceText(node) {
  if (node.nodeType === Node.TEXT_NODE && !(node.parentNode && node.parentNode.nodeName === 'TEXTAREA')) {
      const originalContent = node.dataOriginalContent || node.textContent;
      
      const replacedContent = originalContent.replace(PRICE_REGEX, match => {
          const { value, currency } = parsePrice(match);
          const convertedValue = convertToEUR(value, currency) / hourWorth;
          return `${convertedValue.toFixed(2)} h`;
      });

      if (replacedContent !== originalContent) {
          node.dataOriginalContent = originalContent;
          node.textContent = replacedContent;
      }
  } else {
      Array.from(node.childNodes).forEach(replaceText);
  }
}

function revertToOriginalText(node) {
    if (node.nodeType === Node.TEXT_NODE && node.dataOriginalContent) {
        node.textContent = node.dataOriginalContent;
        node.dataOriginalContent = null;
    } else {
        Array.from(node.childNodes).forEach(revertToOriginalText);
    }
}

async function isExtensionEnabled() {
    const { settings } = await browser.storage.local.get('settings');
    return settings && settings['onOffSwitch'];
}

async function changeValues() {
    if (await isExtensionEnabled()) {
        await refreshHourWorth();
        replaceText(document.body);
    } else {
        revertToOriginalText(document.body);
    }
}

changeValues();

browser.runtime.onMessage.addListener(async request => {
    if (request.action === "settingsUpdated") {
        await changeValues();
    }
});

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.addedNodes) {
            Array.from(mutation.addedNodes).forEach(replaceText);
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });
