const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

class Node {
  constructor(nodeType, nodeName, value = '') {
    this.nodeType = nodeType;
    this.nodeName = nodeName;
    this.nodeValue = value;
    this.childNodes = [];
    this.parentNode = null;
    this.dataOriginalContent = null;
  }
  appendChild(child) {
    child.parentNode = this;
    this.childNodes.push(child);
  }
}

function createElement(name) {
  return new Node(ELEMENT_NODE, name.toUpperCase());
}

function createText(value) {
  const n = new Node(TEXT_NODE, '#text', value);
  n.nodeValue = value;
  return n;
}

const PRICE_REGEX = /(?:(?<=\s)|^)(?:(?:[£€$¥₹₽]|Rs\.?)\s*(?:\d{1,3}(?:[,.\s]\d{3})*|\d+)(?:[.,]\d{0,2})?|(?:\d{1,3}(?:[,.\s]\d{3})*|\d+)(?:[.,]\d{0,2})?\s*(?:[£€$¥₹₽]|Rs\.?))(?:(?=\s)|$)/g;
const CONVERSION_RATES_TO_EUR = {
    '£': 0.85, '€': 1, '$': 0.90, '¥': 0.008, '₹': 0.011, '₽': 0.011, 'Rs': 0.011
};
const hourWorth = 15;
const IGNORE_TAGS = ['TEXTAREA', 'INPUT', 'SCRIPT', 'STYLE', 'NOSCRIPT'];

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

    cleaned = cleaned.replace(/ /g, "");

    if (cleaned.includes(".") && cleaned.includes(",")) {
        if (cleaned.lastIndexOf(".") > cleaned.lastIndexOf(",")) {
            cleaned = cleaned.replace(/,/g, "");
        } else {
            cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
        }
    } else if (cleaned.includes(",")) {
        if ((cleaned.match(/,/g) || []).length > 1 || cleaned.endsWith(",")) {
            cleaned = cleaned.replace(/,/g, "");
        } else {
            cleaned = cleaned.replace(/,/g, ".");
        }
    } else if (cleaned.includes(".")) {
        const dotPosition = cleaned.indexOf(".");
        if ((cleaned.match(/\./g) || []).length > 1 || cleaned.endsWith(".") || cleaned.substring(dotPosition + 1).length > 2) {
            cleaned = cleaned.replace(/\./g, "");
        }
    }

    return cleaned;
}

function convertToEUR(amount, currency) {
    return amount * (CONVERSION_RATES_TO_EUR[currency] || 1);
}

function processTextNode(textNode) {
    const originalContent = textNode.dataOriginalContent || textNode.nodeValue;
    if (originalContent.search(PRICE_REGEX) === -1) {
        return;
    }
    const replacedContent = originalContent.replace(PRICE_REGEX, match => {
        const { value, currency } = parsePrice(match);
        const convertedValue = convertToEUR(value, currency) / hourWorth;
        return `${convertedValue.toFixed(2)} h`;
    });
    if (replacedContent !== originalContent) {
        textNode.dataOriginalContent = originalContent;
        textNode.nodeValue = replacedContent;
    }
}

function replaceRecursive(node) {
    if (node.nodeType === TEXT_NODE && !(node.parentNode && IGNORE_TAGS.includes(node.parentNode.nodeName))) {
        processTextNode(node);
    } else {
        node.childNodes.forEach(replaceRecursive);
    }
}

function walkTextNodes(root, cb) {
    if (root.nodeType === TEXT_NODE) {
        const parentName = root.parentNode && root.parentNode.nodeName;
        if (!parentName || !IGNORE_TAGS.includes(parentName)) {
            cb(root);
        }
        return;
    }
    const stack = [root];
    while (stack.length) {
        const node = stack.pop();
        if (node.nodeType === TEXT_NODE) {
            const pName = node.parentNode && node.parentNode.nodeName;
            if (!pName || !IGNORE_TAGS.includes(pName)) {
                cb(node);
            }
        } else {
            for (let i = node.childNodes.length - 1; i >= 0; i--) {
                stack.push(node.childNodes[i]);
            }
        }
    }
}

function replaceWalker(node) {
    walkTextNodes(node, processTextNode);
}

function buildTree(count) {
    const root = createElement('div');
    for (let i = 0; i < count; i++) {
        const container = createElement('div');
        root.appendChild(container);
        const t1 = createText(`The price is $${i}`);
        const t2 = createText(`Some other text`);
        container.appendChild(t1);
        container.appendChild(t2);
    }
    return root;
}

function cloneTree(node) {
    const copy = new Node(node.nodeType, node.nodeName, node.nodeValue);
    copy.dataOriginalContent = node.dataOriginalContent;
    node.childNodes.forEach(child => {
        copy.appendChild(cloneTree(child));
    });
    return copy;
}

const iterations = 1000;
const root1 = buildTree(iterations);
const root2 = cloneTree(root1);

let t = Date.now();
replaceRecursive(root1);
let recursiveTime = Date.now() - t;

t = Date.now();
replaceWalker(root2);
let walkerTime = Date.now() - t;

console.log(`Recursive: ${recursiveTime}ms`);
console.log(`Tree walker: ${walkerTime}ms`);
