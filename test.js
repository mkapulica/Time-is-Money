// Regular expression pattern
const PRICE_REGEX = /(?:(?<=\s)|^)(?:(?:[£€$¥₹₽]|Rs\.?)\s*(?:\d{1,3}(?:[,.\s]\d{3})*|\d+)(?:[.,]\d{0,2})?|(?:\d{1,3}(?:[,.\s]\d{3})*|\d+)(?:[.,]\d{0,2})?\s*(?:[£€$¥₹₽]|Rs\.?))(?:(?=\s)|$)/g;

// List of price strings to test
const testStrings = [
    '$1,000.00',
    '1,000.00$',
    '$ 1,000.00',
    '1,000.00 $',
    '$1.000,00',
    '1.000,00$',
    '$ 1.000,00',
    '1.000,00 $',
    '$1 000.00',
    '1 000.00$',
    '$ 1 000.00',
    '1 000.00 $',
    '$1 000,00',
    '1 000,00$',
    '$ 1 000,00',
    '1 000,00 $',
    '$1000.00',
    '1000.00$',
    '$ 1000.00',
    '1000.00 $',
    '$1000,00',
    '1000,00$',
    '$ 1000,00',
    '1000,00 $',
    '$1000',
    '1000$',
    '$ 1000',
    '1000 $',
    '$1.000',
    '1.000$',
    '$ 1.000',
    '1.000 $',
    '$1,000',
    '1,000$',
    '$ 1,000',
    '1,000 $'
];

// Test the regular expression pattern against each string
testStrings.forEach((str, index) => {
    const match = str.match(PRICE_REGEX);
    if (match) {
        console.log(`Test ${index + 1}: "${str}" -> Matched`);
    } else {
        console.log(`Test ${index + 1}: "${str}" -> Not Matched`);
    }
});
