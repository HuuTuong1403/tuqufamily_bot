function parseDate(dateStr) {
  if (!dateStr) return null;

  const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateStr.match(datePattern);

  if (!match) return null;

  const day = parseInt(match[1]);
  const month = parseInt(match[2]);
  const year = parseInt(match[3]);

  // Validate ranges
  if (
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12 ||
    year < 2000 ||
    year > 2100
  ) {
    return null;
  }

  // Create date object
  const date = new Date(year, month - 1, day);

  // Check if date is valid (handles invalid dates like 31/02/2025)
  if (
    date.getDate() !== day ||
    date.getMonth() !== month - 1 ||
    date.getFullYear() !== year
  ) {
    return null;
  }

  return date;
}

function parseMonthYear(monthYearStr) {
  if (!monthYearStr) {
    return new Date();
  }

  const monthYearPattern = /^(\d{1,2})\/(\d{4})$/;
  const match = monthYearStr.match(monthYearPattern);

  if (!match) return null;

  const month = parseInt(match[1]);
  const year = parseInt(match[2]);

  // Validate ranges
  if (month < 1 || month > 12 || year < 2000 || year > 2100) {
    return null;
  }

  // Create date object (first day of the month)
  const date = new Date(year, month - 1, 1);

  // Check if date is valid
  if (date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return null;
  }

  return date;
}

module.exports = {
  parseDate,
  parseMonthYear,
};
