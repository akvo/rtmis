import { useMemo } from "react";
import { Button, Col, Input, Row, Select, Space } from "antd";
import { config, store, uiText } from "../../lib";
import { Link } from "react-router-dom";
import debounce from "lodash.debounce";
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";

const { Search } = Input;

const AttributeFilters = ({ onSearchChange = () => {} }) => {
  const authUser = store.useState((s) => s.user);
  const language = store.useState((s) => s.language);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const handleChange = debounce(onSearchChange, 300);
  const attributeTypes = config.attribute.allTypes;

  return (
    <Row>
      <Col flex={1}>
        <Space>
          <Search
            placeholder={text.searchNameOrCode}
            onChange={({ target }) => handleChange(target.value)}
            onSearch={(value) => onSearchChange(value)}
            style={{ width: 240 }}
            allowClear
          />
          <Select
            placeholder={text.attrType}
            options={attributeTypes}
            allowClear
          />
        </Space>
      </Col>
      {["Super Admin"].includes(authUser?.role?.value) && (
        <Col>
          <Space>
            <Link to="/control-center/data/upload">
              <Button icon={<UploadOutlined />} shape="round">
                {text.bulkUploadButton}
              </Button>
            </Link>
            <Button icon={<DownloadOutlined />} shape="round">
              {text.exportButton}
            </Button>
            <Link to={"/control-center/master-data/attributes/add"}>
              <Button type="primary" icon={<PlusOutlined />} shape="round">
                {text.addNewButton}
              </Button>
            </Link>
          </Space>
        </Col>
      )}
    </Row>
  );
};

export default AttributeFilters;
