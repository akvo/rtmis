import { Button, Col, Input, Row, Space } from "antd";
import { store } from "../../lib";
import { Link } from "react-router-dom";
import debounce from "lodash.debounce";
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";

const { Search } = Input;

const AttributeFilters = ({
  onSearchChange = () => {},
  addLink = "/master-data/add-administration",
}) => {
  const authUser = store.useState((s) => s.user);
  const handleChange = debounce(onSearchChange, 300);

  return (
    <Row>
      <Col flex={1}>
        <Space>
          <Search
            placeholder="Enter name or code..."
            onChange={({ target }) => handleChange(target.value)}
            onSearch={(value) => onSearchChange(value)}
            style={{ width: 240 }}
            allowClear
          />
        </Space>
      </Col>
      {["Super Admin"].includes(authUser?.role?.value) && (
        <Col>
          <Space>
            <Link to="/data/upload">
              <Button icon={<UploadOutlined />} shape="round">
                Bulk Upload
              </Button>
            </Link>
            <Button icon={<DownloadOutlined />} shape="round">
              Export
            </Button>
            <Link to={addLink}>
              <Button type="primary" icon={<PlusOutlined />} shape="round">
                Add New
              </Button>
            </Link>
          </Space>
        </Col>
      )}
    </Row>
  );
};

export default AttributeFilters;
