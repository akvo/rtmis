import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ManageData from "../ManageData";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  };

jest.mock("axios");

describe("page/manage-data", () => {
  test("test if ManageData has a list of data", async () => {
    const { container, getByText, getByTestId } = render(<ManageData />, {
      wrapper: MemoryRouter,
    });
    expect(screen.getByText(/Control Center/i)).toBeInTheDocument();

    const fakeData = [
      {
        id: 2152,
        name: "Churo/Amaya - Howard Inc",
        form: 974754029,
        administration: "Churo/Amaya",
        geo: [36.441970658358, 0.868986472010182],
        created_by: "Turkana North Approver",
        updated_by: null,
        created: "January 31, 2022",
        updated: null,
        pending_data: null,
      },
      {
        id: 2156,
        name: "Tangulbei/Korossi - Smith, Robles and Spencer",
        form: 974754029,
        administration: "Tangulbei/Korossi",
        geo: [36.1880630895679, 0.7986885954899671],
        created_by: "unknown 1 User",
        updated_by: null,
        created: "December 23, 2021",
        updated: null,
        pending_data: null,
      },
    ];

    axios.mockResolvedValueOnce({ status: 200, data: fakeData });

    const tableBody = container.querySelector(".ant-table-tbody");
    expect(tableBody.firstChild).toHaveClass("ant-table-placeholder");

    const select = container.querySelector(
      ".ant-select-selection-search-input"
    );
    fireEvent.change(select, { target: { value: "CLT" } });

    const result = container.querySelector(".ant-select-selection-item");
    expect(result).toBeDefined();

    fireEvent.click(getByText("Remove Filters"));
    expect(container.querySelector(".ant-select-selection-item")).toBeNull();

    fireEvent.click(getByTestId("advanced-filter"));
    const advancedFilter = container.querySelector(".advanced-filters");
    expect(advancedFilter).toBeDefined();

    expect(container).toMatchSnapshot();
  });
});
