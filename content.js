const PRICE_REGEX = /(?:(?<=\s)|^)(?:(?:[£€$¥₹₽]|Rs\.?)\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{0,2})?|\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{0,2})?\s*(?:[£€$¥₹₽]|Rs\.?))(?:(?=\s)|$)/g;
const CONVERSION_RATES_TO_EUR = {
    '£': 0.85, '€': 1, '$': 0.90, '¥': 0.008, '₹': 0.011, '₽': 0.011, 'Rs': 0.011
};
const DAYS_IN_YEAR = 365.25;

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
    return ((DAYS_IN_YEAR - vacationDays) / 12 / 7) * weeklyWorkdays * (dailyWorkHours + (dailyCommuteMinutes / 60));
}

function parsePrice(priceStr) {
    const [currencySymbol] = priceStr.match(/[£€$¥₹₽]|Rs\.?/) || [null];
    let cleaned = cleanPriceString(priceStr);
    return {
        value: parseFloat(cleaned),
        currency: currencySymbol
    };
}

function cleanPriceString(priceStr) {
  let cleaned = priceStr.replace(/[£€$¥₹₽]|Rs\.?/g, "").trim();
  const delimiters = new Set(cleaned.match(/[.,]/g));

  if (delimiters.has('.')) {
      if (cleaned.indexOf('.') !== cleaned.lastIndexOf('.') || cleaned.endsWith('.')) {
          cleaned = cleaned.replace(/\./g, "");
      }
      if (cleaned.lastIndexOf(".") < cleaned.lastIndexOf(",")) {
          cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
      }
  }

  if (delimiters.has(',')) {
      if (cleaned.indexOf(',') !== cleaned.lastIndexOf(',') || cleaned.endsWith(',')) {
          cleaned = cleaned.replace(/,/g, "");
      } else {
          cleaned = cleaned.replace(/,/g, ".");
      }
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

async function changeValues() {
    await refreshHourWorth();
    replaceText(document.body);
}

changeValues();

browser.runtime.onMessage.addListener(async request => {
    if (request.action === "settingsUpdated") {
        const data = await browser.storage.local.get('settings');
        if (data.settings) {
            await changeValues();
        }
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
