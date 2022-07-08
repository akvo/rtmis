import { useNotification } from "../hooks";
import { render } from "@testing-library/react";
import { useEffect } from "react";

const TestNotification = () => {
  const { notify } = useNotification();

  useEffect(() => {
    notify({
      type: "error",
      message: "Not Found",
    });
  }, [notify]);
  return <div>Message: Not Found</div>;
};

jest.mock("antd");

describe("util/hooks", () => {
  test("test useNotification", () => {
    const { asFragment } = render(<TestNotification />);
    expect(asFragment()).toMatchSnapshot();
  });
});
