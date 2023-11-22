import { Button, Col, Input, Row, Space } from "antd";
import RemoveFiltersButton from "./RemoveFiltersButton";
import AdministrationDropdown from "./AdministrationDropdown";
import { store } from "../../lib";
import { Link } from "react-router-dom";

const { Search } = Input;

const AdministrationFilters = ({ loading }) => {
  const authUser = store.useState((s) => s.user);

  return (
    <Row>
      <Col flex={1}>
        <Space>
          <Search
            placeholder="Enter name or code..."
            // value={query}
            // onChange={(e) => {
            //   setQuery(e.target.value);
            // }}
            // onSearch={(e) => {
            //   fetchData(e);
            // }}
            style={{ width: 240 }}
            // loading={loading && !!query}
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
            <Link to="/master-data/add-administration">
              <Button type="primary">Add New</Button>
            </Link>
          </Space>
        </Col>
      )}
    </Row>
  );
};
export default AdministrationFilters;
