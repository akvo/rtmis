import React from "react";
import { Spin, Space, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
const { Title } = Typography;
const PageLoader = ({ message }) => {
  return (
    <Space align="start" style={{ width: "100%", minHeight: 280, padding: 30 }}>
      <Space align="center" size="large">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 20 }} spin />} />
        <Title level={5} style={{ marginBottom: 0 }}>
          {message}
        </Title>
      </Space>
    </Space>
  );
};

export default React.memo(PageLoader);
