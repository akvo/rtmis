import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Col, Input, Row, Select, Space } from "antd";
import RemoveFiltersButton from "./RemoveFiltersButton";
import AdministrationDropdown from "./AdministrationDropdown";
import { api, store, uiText } from "../../lib";
import debounce from "lodash.debounce";
import { DownloadOutlined, PlusOutlined } from "@ant-design/icons";

const { Search } = Input;
const { Option } = Select;

const EntityDataFilters = ({
  loading,
  onSearchChange = () => {},
  onEntityTypeChange = () => {},
}) => {
  const [preload, setPreload] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [typeItems, setTypeItems] = useState([]);
  const navigate = useNavigate();

  const entityTypes = store.useState((s) => s.options.entityTypes);
  const authUser = store.useState((s) => s.user);
  const language = store.useState((s) => s.language);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const handleChange = debounce(onSearchChange, 300);

  const fetchEntityTypes = useCallback(async () => {
    if (entityTypes.length && preload) {
      setPreload(false);
      return;
    }
    if ((preload || page <= totalPage) && !entityTypes.length) {
      setPreload(false);
      try {
        const { data: apiData } = await api.get(`/entities?page=${page}`);
        const { data: _types, total_page: _totalPage, current } = apiData || {};
        const allTypes = [...typeItems, ..._types];
        setPage(current + 1);
        setTotalPage(_totalPage);
        setTypeItems(allTypes);
        if (page === _totalPage) {
          store.update((s) => {
            s.options.entityTypes = allTypes;
          });
        }
      } catch {
        store.update((s) => {
          s.options.entityTypes = [];
        });
      }
    }
  }, [preload, page, totalPage, entityTypes, typeItems]);

  useEffect(() => {
    fetchEntityTypes();
  }, [fetchEntityTypes]);

  return (
    <Row>
      <Col flex={1}>
        <Space>
          <Search
            placeholder={text.searchEntity}
            onChange={({ target }) => handleChange(target.value)}
            onSearch={(value) => onSearchChange(value)}
            style={{ width: 240 }}
            allowClear
          />
          <Select
            placeholder={text.entityTypes}
            className="custom-select"
            onChange={(value) => onEntityTypeChange(value)}
            allowClear
          >
            {entityTypes.map((type, tx) => {
              return (
                <Option key={tx} value={type.id}>
                  {type.name}
                </Option>
              );
            })}
          </Select>
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
            <Button
              icon={<DownloadOutlined />}
              shape="round"
              onClick={() => {
                navigate(
                  "/control-center/master-data/upload-administration-data"
                );
              }}
            >
              {text.exportButton}
            </Button>
            <Link to="/control-center/master-data/entities/add">
              <Button type="primary" icon={<PlusOutlined />} shape="round">
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
