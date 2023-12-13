import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button, Col, Input, Row, Space } from "antd";
import RemoveFiltersButton from "./RemoveFiltersButton";
import AdministrationDropdown from "./AdministrationDropdown";
import { store, uiText } from "../../lib";

const { Search } = Input;

const EntityDataFilters = ({ loading }) => {
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
            placeholder={text.searchEntity}
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
            <Button type="primary" shape="round">
              {text.exportButton}
            </Button>
            <Link to="/control-center/master-data/entities/add">
              <Button type="primary" shape="round">
                {text.addEntityData}
              </Button>
            </Link>
          </Space>
        </Col>
      )}
    </Row>
  );
};
export default EntityDataFilters;
