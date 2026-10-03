import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RiskBadge } from "./RiskBadge";

describe("RiskBadge", () => {
  it("renders an unavailable state when the backend omits risk level", () => {
    render(<RiskBadge level={undefined} />);
    expect(screen.getByLabelText("Risk level unavailable")).toHaveTextContent("Risk unavailable");
  });
});