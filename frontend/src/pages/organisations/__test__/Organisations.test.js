import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import Organisations from "../Organisations";
import { MemoryRouter } from "react-router-dom";
import { act } from "react-dom/test-utils";
import TestApp from "../../../TestApp";

jest.mock("axios");

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

describe("components/Organisation", () => {
  test("test Manage organisation", async () => {
    const { container, queryByPlaceholderText } = render(<Organisations />, {
      wrapper: MemoryRouter,
    });

    const fakeData = [
      {
        id: 1,
        name: "Onja",
        attributes: [
          {
            type_id: 1,
            name: "member",
          },
        ],
        users: 22,
      },
    ];

    axios.mockResolvedValue({ status: 200, dataset: fakeData });

    await act(async () => {
      render(<TestApp entryPoint={"/organisations"} />);
    });

    expect(fakeData?.[0]?.id).toBeDefined();
    expect(fakeData?.[0]?.name).toBeDefined();
    expect(fakeData?.[0]?.users).toBeDefined();

    // Input search
    jest.fn(() => {});
    const searchInput = queryByPlaceholderText("Search...");
    fireEvent.change(searchInput, { target: { value: "Onja" } });
    expect(searchInput.value).toBe("Onja");

    // Select dropdwon
    const select = container.querySelector(
      ".ant-select-selection-search-input"
    );
    fireEvent.click(select, { target: { value: "1" } });
    expect(select.value).toBe("1");

    expect(container).toMatchSnapshot();
  });
});
