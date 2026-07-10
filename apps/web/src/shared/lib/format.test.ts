import { describe, it, expect } from "vitest";
import { formatCurrency, formatRelativeDate, formatMessageTime } from "./format";

describe("Formatting Utilities", () => {
  describe("formatCurrency", () => {
    it("formats standard amounts correctly and rounds to nearest integer", () => {
      expect(formatCurrency(1234.5)).toBe("₹1,235");
    });
    
    it("handles zero correctly", () => {
      expect(formatCurrency(0)).toBe("₹0");
    });

    it("formats negative amounts as absolute value (as per current implementation)", () => {
      expect(formatCurrency(-500)).toBe("₹500");
    });
  });

  describe("formatRelativeDate", () => {
    it("formats a date close to now", () => {
      const now = new Date();
      expect(formatRelativeDate(now.toISOString())).toBe("Just now");
    });
  });
});
