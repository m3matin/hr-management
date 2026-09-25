const MINOR_UNIT_DIGITS = 2;

function splitMinorAmount(amountMinor: string | number | null | undefined) {
  const normalized = String(amountMinor ?? "0").trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const digits = normalized.padStart(MINOR_UNIT_DIGITS + 1, "0");
  return {
    whole: digits.slice(0, -MINOR_UNIT_DIGITS).replace(/^0+(?=\d)/, ""),
    fraction: digits.slice(-MINOR_UNIT_DIGITS),
  };
}

/**
 * Format integer minor currency units without converting the amount to a
 * JavaScript number, which could lose precision for large BIGINT values.
 */
export function formatMoney(
  amountMinor: string | number | null | undefined,
  currency: string,
): string {
  const parts = splitMinorAmount(amountMinor);
  if (!parts) {
    return `${String(amountMinor ?? 0)} ${currency}`;
  }

  try {
    const currencyFormatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: MINOR_UNIT_DIGITS,
      maximumFractionDigits: MINOR_UNIT_DIGITS,
    });
    const wholeNumberFormatter = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    });
    const wholeParts = wholeNumberFormatter.formatToParts(BigInt(parts.whole));
    const template = currencyFormatter.formatToParts(0);
    const integerIndex = template.findIndex((part) => part.type === "integer");
    const decimal =
      currencyFormatter
        .formatToParts(1.01)
        .find((part) => part.type === "decimal")?.value ?? ".";

    return [
      ...template.slice(0, integerIndex),
      ...wholeParts,
      { type: "decimal", value: decimal },
      { type: "fraction", value: parts.fraction },
      ...template.slice(integerIndex + 1),
    ]
      .map((part) => part.value)
      .join("");
  } catch {
    return `${wholeNumberFallback(parts.whole)}.${parts.fraction} ${currency}`;
  }
}

function wholeNumberFallback(whole: string): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(BigInt(whole));
}

/** Convert a user-entered major-unit amount into safe integer minor units. */
export function majorAmountToMinor(amount: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(amount.trim());
  if (!match) {
    return null;
  }

  const minor =
    BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0"));
  if (minor <= 0n || minor > BigInt(Number.MAX_SAFE_INTEGER)) {
    return null;
  }

  return Number(minor);
}

/** Convert integer minor units into a user-facing major-unit amount. */
export function minorAmountToMajorAmount(
  amountMinor: string | number | null | undefined,
): string {
  if (amountMinor === null || amountMinor === undefined || amountMinor === "") {
    return "";
  }

  const parts = splitMinorAmount(amountMinor);
  return parts ? `${parts.whole}.${parts.fraction}` : "";
}
