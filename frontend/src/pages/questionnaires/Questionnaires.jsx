import React, { useMemo, useEffect, useState } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Button,
  Divider,
  Table,
  ConfigProvider,
  Checkbox,
  Empty,
  Space,
} from "antd";
import { api, store } from "../../lib";
import { Breadcrumbs } from "../../components";
import { reloadData } from "../../util/form";
import { useNotification } from "../../util/hooks";

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Approvals",
    link: "/approvals",
  },
  {
    title: "Manage Questionnaires Approvals",
  },
];

const Questionnaires = () => {
  const { forms, user } = store.useState((s) => s);
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();

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
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
        </Col>
        <Col>
          <Space size={6}>
            <Button
              className="light"
              disabled={isPristine}
              onClick={() => {
                const cloned = JSON.parse(JSON.stringify(forms));
                setDataset(cloned);
              }}
            >
              Reset
            </Button>
            <Button
              type="primary"
              disabled={isPristine}
              onClick={handleSubmit}
              loading={loading}
            >
              Save
            </Button>
          </Space>
        </Col>
      </Row>
      <Divider />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 30 }}
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
      </Card>
    </div>
  );
};

export default React.memo(Questionnaires);
