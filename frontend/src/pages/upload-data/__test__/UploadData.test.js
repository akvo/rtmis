import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import { act } from "react-dom/test-utils";
import UploadData from "../UploadData";

jest.mock("axios");

describe("page/upload-data", () => {
  let file;

  beforeEach(() => {
    file = new File(["(⌐□_□)"], "chucknorris.png", { type: "image/png" });
  });

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

    // Drag and drop file
    const uploadedFile = {
      file: {
        uid: "rc-upload-1658902625996-2",
        lastModified: 1654609229865,
        lastModifiedDate: "2022-06-07T13:40:29.865Z",
        name: "7a13eac4-bfd9-46ab-8bb1-c8ea25bd05ed.xlsx",
        size: 9104,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        percent: 0,
        originFileObj: {
          uid: "rc-upload-1658902625996-2",
        },
        status: "uploading",
      },
      fileList: [
        {
          uid: "rc-upload-1658902625996-2",
          lastModified: 1654609229865,
          lastModifiedDate: "2022-06-07T13:40:29.865Z",
          name: "7a13eac4-bfd9-46ab-8bb1-c8ea25bd05ed.xlsx",
          size: 9104,
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          percent: 0,
          originFileObj: {
            uid: "rc-upload-1658902625996-2",
          },
          status: "uploading",
        },
      ],
    };
    const uploader = screen.getByTestId("drop-file");
    await waitFor(() => {
      fireEvent.change(uploader, {
        target: { files: [file] },
      });
      axios.mockResolvedValueOnce({ status: 200, data: uploadedFile });
    });
    expect(uploadedFile).toHaveProperty("file");
    expect(uploadedFile).toHaveProperty("fileList");
    expect(uploadedFile).toMatchSnapshot("uploadedFile");

    expect(container).toMatchSnapshot();
  });
});
