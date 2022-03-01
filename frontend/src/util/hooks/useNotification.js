import { useMemo } from "react";
import PropTypes from "prop-types";
import { message } from "antd";

function useNotification() {
  return useMemo(() => {
    const notify = ({ type, message: content, ...props }) => {
      message.open({
        type,
        content,
        style: { textAlign: "right", marginRight: 20 },
        ...props,
      });
    };
    notify.propTypes = {
      type: PropTypes.oneOf(["success", "error", "info", "warning"]),
      message: PropTypes.string,
    };
    return { notify };
  }, []);
}

export default useNotification;
