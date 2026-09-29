export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "0 so'm";
  }
  const num = Math.round(Number(amount));
  return num.toLocaleString('uz-UZ') + " so'm";
}

export function toDecimalString(val) {
  const num = Number(val) || 0;
  return num.toFixed(2);
}

export function safeAdd(...numbers) {
  const sum = numbers.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  return Math.round(sum * 100) / 100;
}

export function formatDateTime(isoString) {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function getUnitLabel(unit) {
  switch (unit) {
    case 'KG': return 'kg';
    case 'LITER': return 'litr';
    case 'ITEM':
    default: return 'dona';
  }
}
