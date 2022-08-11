import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Questionnaires from "../Questionnaires";
import { act } from "react-dom/test-utils";
import axios from "axios";

jest.mock("axios");

describe("pages/approvals", () => {
  test("test approval page", async () => {
    const { container } = render(<Questionnaires />, { wrapper: MemoryRouter });
    expect(screen.getByText("Approvals")).toBeInTheDocument();
    expect(
      screen.getByText("Manage Questionnaires Approvals")
    ).toBeInTheDocument();
    const resetBtn = screen.getByTestId("reset-btn");
    const saveBtn = screen.getByTestId("save-btn");

    // Handle click on reset button
    fireEvent.click(resetBtn);
    expect(resetBtn).toHaveAttribute("disabled");
    expect(saveBtn).toHaveAttribute("disabled");

    // Handle click on save button
    fireEvent.click(saveBtn);
    await act(async () => {
      axios.mockResolvedValueOnce({ status: 200 });
    });

    expect(screen.getByText("Questionnaire")).toBeInTheDocument();
    expect(screen.getByText("Questionnaire Description")).toBeInTheDocument();
    expect(screen.getByText("National")).toBeInTheDocument();
    expect(screen.getByText("County")).toBeInTheDocument();

    expect(container).toMatchSnapshot();
  });
});
