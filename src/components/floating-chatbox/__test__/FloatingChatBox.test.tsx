import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FloatingChatBox from "../FloatingChatBox";

describe("FloatingChatBox component", () => {
  it("FloatingChatBox should render correctly", () => {
    render(<FloatingChatBox />);
    const component = screen.getByRole("button");
    expect(component).toBeInTheDocument();
  });
});
