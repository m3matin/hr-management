import {
  formatMoney,
  majorAmountToMinor,
  minorAmountToMajorAmount,
} from "./formatMoney";

describe("money utilities", () => {
  it("converts major-unit input to exact minor units", () => {
    expect(majorAmountToMinor("1234.56")).toBe(123456);
    expect(majorAmountToMinor("0.01")).toBe(1);
  });

  it("rejects invalid or unsafe salary input", () => {
    expect(majorAmountToMinor("0")).toBeNull();
    expect(majorAmountToMinor("1.001")).toBeNull();
    expect(majorAmountToMinor("90071992547409.92")).toBeNull();
  });

  it("converts minor units to a major-unit input value", () => {
    expect(minorAmountToMajorAmount("123456")).toBe("1234.56");
    expect(minorAmountToMajorAmount("1")).toBe("0.01");
    expect(minorAmountToMajorAmount(null)).toBe("");
  });

  it("formats values beyond Number's safe integer range without rounding", () => {
    const whole = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    }).format(9007199254740991n);

    expect(formatMoney("900719925474099101", "USD")).toContain(`${whole}.01`);
  });
});
