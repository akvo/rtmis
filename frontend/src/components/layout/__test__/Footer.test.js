import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Footer from "../Footer";

jest.mock("axios");

// Footer tests
describe("components/Footer", () => {
  test("test if all headings and links are on the DOM", async () => {
    const { container } = render(<Footer />, { wrapper: MemoryRouter });
    expect(screen.getByText(/About Data/i)).toBeInTheDocument();
    expect(screen.getByText("External Links")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Contacts")).toBeInTheDocument();
    expect(screen.getByText(/JMP/i)).toHaveProperty("href");

    expect(container).toMatchSnapshot();
  });
});
