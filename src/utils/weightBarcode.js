// EAN-13 Retail Weight-embedded Barcode Generator & Parser
// Standard: 22 PPPPP WWWWW C (Prefix 22, Product ID 4-5 digits, Weight in grams 5 digits, 1 checksum)

export function calculateEan13Checksum(code12) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code12[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

/**
 * Generates an EAN-13 weight barcode.
 * @param {number|string} productId - Product ID (up to 4 digits)
 * @param {number} weightInKg - Weight in kilograms (e.g. 1.450 kg)
 * @returns {string} 13-digit EAN-13 barcode (e.g., "220113014506")
 */
export function generateWeightBarcode(productId, weightInKg) {
  // Prefix 22 denotes weighed in-store items
  const prefix = '22';
  
  // 4-digit zero-padded product PLU
  const pluStr = String(productId).padStart(4, '0').slice(-4);
  
  // 5-digit zero-padded grams (e.g., 1.450 kg -> 01450 g)
  const grams = Math.round(weightInKg * 1000);
  const gramsStr = String(grams).padStart(5, '0').slice(-5);
  
  const base12 = `${prefix}${pluStr}${gramsStr}`;
  const checksum = calculateEan13Checksum(base12);
  
  return `${base12}${checksum}`;
}

/**
 * Parses any scanned barcode to check if it's a weight-embedded barcode.
 * @param {string} barcode 
 * @param {Array} products 
 * @returns {Object|null}
 */
export function parseWeightBarcode(barcode, products = []) {
  if (!barcode) return null;
  const clean = String(barcode).trim();

  // 1. Check if scanned as 2D QR Code JSON payload
  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const data = JSON.parse(clean);
      if (data && (data.weight || data.weightInKg) && (data.id || data.barcode)) {
        const matched = products.find(
          (p) =>
            p.id === data.id ||
            p.id?.toString() === String(data.id) ||
            (data.barcode && p.barcode === data.barcode)
        );
        if (matched) {
          const weightInKg = Number(data.weight || data.weightInKg) || 1;
          const pricePerKg = Number(matched.sell_price) || 0;
          const totalPrice = data.price || Math.round(pricePerKg * weightInKg);
          return {
            isWeightBarcode: true,
            product: matched,
            weightInKg,
            pricePerKg,
            totalPrice,
            rawBarcode: clean,
          };
        }
      }
    } catch {
      // not JSON, continue to 1D check
    }
  }

  // 2. Weight barcodes start with prefix 21 or 22 and are 12 or 13 digits
  if ((clean.startsWith('22') || clean.startsWith('21')) && (clean.length === 12 || clean.length === 13)) {
    const pluStr = clean.substring(2, 6);
    const gramsStr = clean.substring(6, 11);

    const pluNum = parseInt(pluStr, 10);
    const grams = parseInt(gramsStr, 10);
    const weightInKg = grams / 1000;

    // Find product matching this PLU or ID
    const matched = products.find(
      (p) =>
        p.id === pluNum ||
        p.id?.toString() === pluStr ||
        p.barcode?.includes(pluStr)
    );

    if (matched) {
      const pricePerKg = Number(matched.sell_price) || 0;
      const totalPrice = Math.round(pricePerKg * weightInKg);

      return {
        isWeightBarcode: true,
        product: matched,
        weightInKg,
        pricePerKg,
        totalPrice,
        rawBarcode: clean,
      };
    }
  }

  return null;
}
