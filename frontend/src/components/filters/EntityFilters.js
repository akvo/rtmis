import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button, Col, Input, Row, Space } from "antd";
import { store, uiText } from "../../lib";

const { Search } = Input;

const EntityFilters = () => {
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
            placeholder={text.searchEntityType}
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
        </Space>
      </Col>
      {["Super Admin"].includes(authUser?.role?.value) && (
        <Col>
          <Space>
            <Link to="/control-center/master-data/entity-types/add">
              <Button type="primary" shape="round">
                {text.addEntity}
              </Button>
            </Link>
          </Space>
        </Col>
      )}
    </Row>
  );
};
export default EntityFilters;
