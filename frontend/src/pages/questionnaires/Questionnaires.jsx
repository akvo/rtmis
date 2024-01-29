import React, { useMemo, useEffect, useState } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Button,
  Table,
  ConfigProvider,
  Checkbox,
  Empty,
  Space,
} from "antd";
import { api, store, uiText } from "../../lib";
import { Breadcrumbs } from "../../components";
import { reloadData } from "../../util/form";
import { useNotification } from "../../util/hooks";

const Questionnaires = () => {
  const { forms, user } = store.useState((s) => s);
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();

  const { language } = store.useState((s) => s);

  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.approvalsTitle,
      link: "/control-center/approvals",
    },
    {
      title: text.manageQnApproval,
    },
  ];

  useEffect(() => {
    if (forms.length) {
      setDataset([...forms]);
    }
  }, [forms]);

  const columns = [
    {
      title: "Questionnaire",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Questionnaire Description",
      dataIndex: "description",
      render: (cell) => cell || <span>-</span>,
    },
    {
      title: "National",
      render: (row) => (
        <Checkbox
          checked={row.type === 2}
          onChange={() => {
            handleChecked(row.id, 2);
          }}
        />
      ),
    },
    {
      title: "County",
      render: (row) => (
        <Checkbox
          checked={row.type === 1}
          onChange={() => {
            handleChecked(row.id, 1);
          }}
        />
      ),
    },
  ];

  const handleChecked = (id, val) => {
    const pos = dataset.findIndex((d) => d.id === id);
    if (pos !== -1) {
      const cloned = JSON.parse(JSON.stringify(dataset));
      cloned[pos].type = val;
      setDataset(cloned);
    }
  };

  const handleSubmit = () => {
    const data = dataset.map((d) => ({
      form_id: d.id,
      type: d.type,
    }));
    setLoading(true);
    api
      .post("form/type", data)
      .then(() => {
        setLoading(false);
        notify({
          type: "success",
          message: "Questionnaires updated",
        });
        reloadData(user, dataset);
      })
      .catch(() => {
        notify({
          type: "error",
          message: "Could not update Questionnaires",
        });
        setLoading(false);
      });
  };

  const handleChange = () => {
    // setCurrentPage(e.current);
  };

  const isPristine = useMemo(() => {
    return JSON.stringify(dataset) === JSON.stringify(forms);
  }, [dataset, forms]);

  return (
    <div id="questionnaires">
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
          </Col>
          <Col>
            <Space size={6}>
              <Button
                className="light"
                shape="round"
                disabled={isPristine}
                onClick={() => {
                  const cloned = JSON.parse(JSON.stringify(forms));
                  setDataset(cloned);
                }}
              >
                {text.resetText}
              </Button>
              <Button
                type="primary"
                disabled={isPristine}
                onClick={handleSubmit}
                loading={loading}
                shape="round"
              >
                {text.saveButton}
              </Button>
            </Space>
          </Col>
        </Row>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <div
            style={{ padding: 0, minHeight: "40vh" }}
            bodystyle={{ padding: 30 }}
          >
            <ConfigProvider renderEmpty={() => <Empty description="No data" />}>
              <Table
                columns={columns}
                dataSource={dataset}
                loading={!dataset.length}
                onChange={handleChange}
                // pagination={{
                //   total: totalCount,
                //   pageSize: 10,
                // }}
                pagination={false}
                rowKey="id"
              />
            </ConfigProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Questionnaires);
