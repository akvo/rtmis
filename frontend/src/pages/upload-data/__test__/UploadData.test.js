import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import { act } from "react-dom/test-utils";
import UploadData from "../UploadData";

jest.mock("axios");

describe("page/upload-data", () => {
  test("test if users can upload data", async () => {
    axios.mockResolvedValueOnce({ status: 200 });

    const { container, getByTestId, getByText } = render(<UploadData />, {
      wrapper: MemoryRouter,
    });
    expect(getByText("Data Upload")).toBeInTheDocument();

    // Checkbox
    expect(getByText("Update Existing Data")).toBeInTheDocument();
    const checkbox = getByTestId("update-existing-data");
    expect(checkbox.checked).toEqual(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toEqual(true);

    // Download data
    expect(
      getByText("If you do not already have a template, please download it")
    ).toBeInTheDocument();
    const select = getByTestId("select-form");
    fireEvent.change(
      select.querySelector(".ant-select-selection-search-input"),
      { target: { value: 1 } }
    );

    // Download button
    const templateLink = (
      <a
        href="blob:http://localhost:3000/dbe88d95-638b-46f9-8bf0-abb231f49bc8"
        download="563350033-WASH-in-Schools.xlsx"
      ></a>
    );
    const downloadTemplateBtn = getByTestId("download-template-btn");
    await act(async () => {
      fireEvent.click(downloadTemplateBtn);
      axios.mockResolvedValueOnce({ status: 200, data: templateLink });
    });

    expect(container).toMatchSnapshot();
  });
});
