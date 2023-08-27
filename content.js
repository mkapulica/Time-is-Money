// The regular expression for price detection.
const priceRegex = /(?:(?<=\s)|^)(?:(?:[£€$¥₹₽]|Rs\.?)\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{0,2})?|\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{0,2})?\s*(?:[£€$¥₹₽]|Rs\.?))(?:(?=\s)|$)/g;

const conversionRatesToEUR = {
    '£': 0.85,   // example rate for GBP to EUR
    '€': 1,     // EUR to EUR is 1:1
    '$': 0.90,  // example rate for USD to EUR
    '¥': 0.008, // example rate for JPY to EUR
    '₹': 0.011, // example rate for INR to EUR
    '₽': 0.011, // example rate for RUB to EUR
    'Rs': 0.011 // treating Rs also as INR for this example
};

let hourWorth = null;

async function refreshHourWorth() {
  hourWorth = await getHourWorth();
}

// Get settings from browser storage
function getHourWorth() {
  return new Promise((resolve, reject) => {
      browser.storage.local.get('settings', function(data) {
          if (data.settings) {
              var monthlyIncome = Number(data.settings.monthlyIncome);
              var weeklyWorkdays = Number(data.settings.weeklyWorkdays);
              var dailyWorkHours = Number(data.settings.dailyWorkHours);
              var dailyCommuteMinutes = Number(data.settings.dailyCommuteMinutes);
              var monthlyCommuteCost = Number(data.settings.monthlyCommuteCost);
              var vacationDays = Number(data.settings.vacationDays);

              var monthlyWorkHours = ((365.25 - vacationDays) / 12.0 / 7.0) * weeklyWorkdays * (dailyWorkHours + (dailyCommuteMinutes / 60.0));

              var hourWorth = (monthlyIncome - monthlyCommuteCost) / monthlyWorkHours;

              resolve(hourWorth);  // Resolve the promise with hourWorth
          } else {
              reject("No settings found.");  // Reject if no settings
          }
      });
  });
}

function parsePrice(priceStr) {
    let currencySymbol = priceStr.match(/[£€$¥₹₽]|Rs\.?/)[0];
    // Remove any currency symbols.
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

    return {
        value: parseFloat(cleaned),
        currency: currencySymbol
    };
}

function convertToEUR(amount, currency) {
    if (conversionRatesToEUR[currency]) {
        return amount * conversionRatesToEUR[currency];
    }
    return amount; // If no conversion rate found, return the original amount (this could be improved)
}

/**
 * Substitutes replaced price text into text nodes.
 * If the node contains more than just text (ex: it has child nodes),
 * call replaceText() on each of its children.
 *
 * @param  {Node} node    - The target DOM Node.
 * @return {void}         - Note: the price substitution is done inline.
 */
async function replaceText(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.parentNode && node.parentNode.nodeName === 'TEXTAREA') {
      return;
    }

    // Check if we've stored the original content before
    const originalContent = node.dataOriginalContent || node.textContent;
    node.dataOriginalContent = originalContent;  // Store the original content

    // Replace every occurrence of 'price' in 'content' with its "Replaced" tag.
    let content = originalContent.replace(priceRegex, (match) => {
        const parsed = parsePrice(match);
        const value = convertToEUR(parsed.value, parsed.currency);
        const convertedValue = value / hourWorth;  // Example conversion
        return convertedValue.toFixed(2).toString() + " h";
    });

    node.textContent = content;
  } else {
    for (let i = 0; i < node.childNodes.length; i++) {
      replaceText(node.childNodes[i]);
    }
  }
}

async function changeValues() {
  await refreshHourWorth();
  // Start the recursion from the body tag.
  replaceText(document.body);
}

changeValues();

browser.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
  if (request.action === "settingsUpdated") {
      // Fetch the new settings
      const data = await browser.storage.local.get('settings');
      if (data.settings) {
          await changeValues();
      }
  }
});

// Now monitor the DOM for additions and replace prices in new nodes.
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const newNode = mutation.addedNodes[i];
        replaceText(newNode);
      }
    }
  });
});
observer.observe(document.body, {
  childList: true,
  subtree: true
});