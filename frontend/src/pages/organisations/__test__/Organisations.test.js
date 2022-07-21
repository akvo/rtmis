import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import Organisations from "../Organisations";
// import AddOrganisation from "../add-organisation/AddOrganisation";
import { MemoryRouter } from "react-router-dom";
import { userEvent } from "@testing-library/user-event";

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

    // Edit
    // const edit = screen.getByText(/EDIT/i).closest("a");
    // expect(edit).toHaveAttribute("href", "/organisation/1")
    // userEvent.click(edit, { button: 0});
    // await waitFor(() => {
    //   const { baseElements } = render(<AddOrganisation />, { wrapper: MemoryRouter});
    //   expect(baseElements).toMatchSnapshot();
    // });

    // Delete
    // fireEvent.click(getByTestId("delete"));
    // await waitFor(() => {
    //   expect(
    //     container.querySelector(".organisation-modal")
    //   ).toBeDefined();
    // });

    expect(container).toMatchSnapshot();
  });
});
