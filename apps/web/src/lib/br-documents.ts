export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export type NormalizedBrazilPhone = {
  isMobile: boolean;
  isValid: boolean;
  value: string;
};

export function normalizeBrazilPhone(value: string): NormalizedBrazilPhone {
  const digits = onlyDigits(value);

  if (!digits) {
    return {
      isMobile: false,
      isValid: true,
      value: ""
    };
  }

  const nationalNumber =
    digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
      ? digits.slice(2)
      : digits;

  const isLandline = nationalNumber.length === 10;
  const isMobile = nationalNumber.length === 11 && nationalNumber[2] === "9";

  if (!isLandline && !isMobile) {
    return {
      isMobile: false,
      isValid: false,
      value
    };
  }

  return {
    isMobile,
    isValid: true,
    value: `+55${nationalNumber}`
  };
}

export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);

  if (!/^\d{11}$/.test(digits) || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const firstDigit = calculateCpfDigit(digits.slice(0, 9));
  const secondDigit = calculateCpfDigit(`${digits.slice(0, 9)}${firstDigit}`);

  return digits === `${digits.slice(0, 9)}${firstDigit}${secondDigit}`;
}

export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value);

  if (!/^\d{14}$/.test(digits) || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const firstDigit = calculateCnpjDigit(digits.slice(0, 12));
  const secondDigit = calculateCnpjDigit(`${digits.slice(0, 12)}${firstDigit}`);

  return digits === `${digits.slice(0, 12)}${firstDigit}${secondDigit}`;
}

function calculateCpfDigit(base: string): number {
  const weightStart = base.length + 1;
  const sum = [...base].reduce((total, digit, index) => {
    return total + Number(digit) * (weightStart - index);
  }, 0);
  const rest = (sum * 10) % 11;

  return rest === 10 ? 0 : rest;
}

function calculateCnpjDigit(base: string): number {
  const weights =
    base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum = [...base].reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  const rest = sum % 11;

  return rest < 2 ? 0 : 11 - rest;
}
