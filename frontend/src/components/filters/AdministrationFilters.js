import { useMemo } from "react";
import { Button, Col, Input, Row, Space } from "antd";
import RemoveFiltersButton from "./RemoveFiltersButton";
import AdministrationDropdown from "./AdministrationDropdown";
import { store, uiText } from "../../lib";
import { Link } from "react-router-dom";
import debounce from "lodash.debounce";
import {
  DownloadOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Fragment } from "react";

const { Search } = Input;

const AdministrationFilters = ({
  loading,
  onSearchChange = () => {},
  addLink = "/control-center/master-data/add-administration",
  maxLevel = null,
}) => {
  const authUser = store.useState((s) => s.user);
  const language = store.useState((s) => s.language);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const handleChange = debounce(onSearchChange, 300);

  return (
    <Fragment>
      <Row style={{ marginBottom: "16px" }}>
        <Col flex={1}>
          <Space>
            <Search
              placeholder={text.searchNameOrCode}
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
              <Link to="/control-center/master-data/upload-administration-data">
                <Button icon={<UploadOutlined />} shape="round">
                  {text.bulkUploadButton}
                </Button>
              </Link>
              <Link to="/control-center/master-data/download-administration-data">
                <Button icon={<DownloadOutlined />} shape="round">
                  {text.download}
                </Button>
              </Link>
              <Link to={addLink}>
                <Button type="primary" icon={<PlusOutlined />} shape="round">
                  {text.addNewButton}
                </Button>
              </Link>
            </Space>
          </Col>
        )}
      </Row>
      <Row>
        <Col>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <AdministrationDropdown loading={loading} maxLevel={maxLevel} />
            <RemoveFiltersButton
              extra={(s) => {
                s.filters = { trained: null, role: null, organisation: null };
              }}
            />
          </div>
        </Col>
      </Row>
    </Fragment>
  );
};
export default AdministrationFilters;
