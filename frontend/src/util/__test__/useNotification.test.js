import { useNotification } from "../hooks";
import { render } from "@testing-library/react";
import { useEffect } from "react";
import { message } from "antd";

const TestNotification = ({ notificationBody }) => {
  const { notify } = useNotification();

  useEffect(() => {
    notify(notificationBody);
  }, [notify, notificationBody]);
  return <div>Message: Not Found</div>;
};

jest.mock("antd", () => ({ message: { open: jest.fn(), config: jest.fn() } }));

const notify = {
  content: "Not Found",
  style: {
    marginRight: 20,
    textAlign: "right",
  },
  type: "error",
};

describe("util/hooks", () => {
  test("test Notification that shows error type with default style", () => {
    const notificationBody = {
      type: "error",
      message: "Not Found",
    };
    render(<TestNotification notificationBody={notificationBody} />);
    expect(message.open).toHaveBeenCalledTimes(1);
    expect(message.open).toHaveBeenCalledWith(notify);
    expect(message.open).toMatchSnapshot();
  });
  test("shows Notification when no body is passed", () => {
    const notificationBody = {};
    render(<TestNotification notificationBody={notificationBody} />);
    expect(message.open).toHaveBeenCalledTimes(1);
  });
});
