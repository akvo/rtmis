import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button, Col, Input, Row, Space } from "antd";
import { store, uiText } from "../../lib";
import debounce from "lodash.debounce";
import { PlusOutlined } from "@ant-design/icons";

const { Search } = Input;

const EntityFilters = ({ onSearchChange = () => {} }) => {
  const authUser = store.useState((s) => s.user);
  const language = store.useState((s) => s.language);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const handleChange = debounce(onSearchChange, 300);

  return (
    <Row>
      <Col flex={1}>
        <Space>
          <Search
            placeholder={text.searchEntityType}
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
            <Link to="/control-center/master-data/entity-types/add">
              <Button type="primary" icon={<PlusOutlined />} shape="round">
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
