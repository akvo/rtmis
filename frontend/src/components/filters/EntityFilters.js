import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button, Col, Input, Row, Space } from "antd";
import RemoveFiltersButton from "./RemoveFiltersButton";
import AdministrationDropdown from "./AdministrationDropdown";
import { store, uiText } from "../../lib";

const { Search } = Input;

const EntityFilters = ({ loading }) => {
  const authUser = store.useState((s) => s.user);
  const language = store.useState((s) => s.language);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  return (
    <Row>
      <Col flex={1}>
        <Space>
          <Search
            placeholder="Enter name..."
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
            <Link to="/master-data/entity-types/add">
              <Button type="primary">{text.addEntity}</Button>
            </Link>
          </Space>
        </Col>
      )}
    </Row>
  );
};
export default EntityFilters;
