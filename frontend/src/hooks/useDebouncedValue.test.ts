import { act, renderHook } from "@testing-library/react";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the settled value after the delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 400),
      { initialProps: { value: "first" } },
    );

    rerender({ value: "second" });
    expect(result.current).toBe("first");

    act(() => {
      jest.advanceTimersByTime(399);
    });
    expect(result.current).toBe("first");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("second");
  });

  it("cleans up a pending timer when unmounted", () => {
    const { rerender, unmount } = renderHook(
      ({ value }) => useDebouncedValue(value, 400),
      { initialProps: { value: "first" } },
    );

    rerender({ value: "second" });
    unmount();

    expect(() => jest.runAllTimers()).not.toThrow();
  });
});
