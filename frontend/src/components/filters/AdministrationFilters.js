import { Button, Col, Input, Row, Space } from "antd";
import RemoveFiltersButton from "./RemoveFiltersButton";
import AdministrationDropdown from "./AdministrationDropdown";
import { store } from "../../lib";
import { Link } from "react-router-dom";
import debounce from "lodash.debounce";

const { Search } = Input;

const AdministrationFilters = ({
  loading,
  onSearchChange = console.log,
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
          <AdministrationDropdown loading={loading} />
          <RemoveFiltersButton
            extra={(s) => {
              s.filters = { trained: null, role: null, organisation: null };
            }}
          />
        </Space>
      </Col>
      {["Super Admin"].includes(authUser?.role?.value) && (
        <Col>
          <Space>
            <Link to="/data/upload">
              <Button type="primary">Bulk Upload</Button>
            </Link>
            <Button type="primary">Export</Button>
            <Link to={addLink}>
              <Button type="primary">Add New</Button>
            </Link>
          </Space>
        </Col>
      )}
    </Row>
  );
};
export default AdministrationFilters;
