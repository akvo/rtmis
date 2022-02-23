import React, { useMemo, useState, useEffect } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Divider,
  Table,
  ConfigProvider,
  Empty,
  Checkbox,
  Space,
  Button,
  message,
} from "antd";
import { api, store } from "../../lib";
import { Breadcrumbs } from "../../components";
import { reloadData } from "../../util/form";

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

const QuestionnairesAdmin = () => {
  const { forms } = store.useState((s) => s);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataset, setDataset] = useState([]);
  const [dataOriginal, setDataOriginal] = useState("");

  const columns = [
    {
      title: "Questionnaire",
      dataIndex: "form_id",
      render: (cell) => forms.find((f) => f.id == cell)?.name || "",
    },
    {
      title: "Questionnaire Description",
      dataIndex: "description",
      render: (cell) => cell || <span>-</span>,
    },
    {
      title: "Sub-County",
      render: (row) => (
        <Checkbox
          checked={row.levels?.includes(3)}
          onChange={() => {
            handleChecked(row.form_id, 3);
          }}
        />
      ),
    },
    {
      title: "Ward",
      render: (row) => (
        <Checkbox
          checked={row.levels?.includes(4)}
          onChange={() => {
            handleChecked(row.form_id, 4);
          }}
        />
      ),
    },
    {
      title: "Community",
      render: (row) => (
        <Checkbox
          checked={row.levels?.includes(5)}
          onChange={() => {
            handleChecked(row.form_id, 5);
          }}
        />
      ),
    },
  ];

  const handleChecked = (id, val) => {
    const pos = dataset.findIndex((d) => d.form_id === id);
    if (pos !== -1) {
      const cloned = JSON.parse(JSON.stringify(dataset));
      const exists = dataset[pos].levels?.includes(val);
      if (exists) {
        cloned[pos].levels = cloned[pos].levels.filter((i) => i !== val);
      } else {
        cloned[pos].levels.push(val);
      }
      setDataset(cloned);
    }
  };

  useEffect(() => {
    if (forms.length) {
      setLoading(true);
      api
        .get("form/approval-level/")
        .then((res) => {
          setDataset(res.data);
          setDataOriginal(JSON.stringify(res.data));
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [forms]);

  const handleChange = () => {
    // setCurrentPage(e.current);
  };

  const handleSubmit = () => {
    const data = dataset.map((d) => ({
      form_id: d.form_id,
      level_id: d.levels,
    }));
    setSaving(true);
    api
      .post("edit/form/approval/", data)
      .then(() => {
        setSaving(false);
        message.success("Questionnaires updated");
        reloadData();
      })
      .catch(() => {
        message.error("Could not update Questionnaires");
        setSaving(false);
      });
  };

  const isPristine = useMemo(() => {
    return JSON.stringify(dataset) === dataOriginal;
  }, [dataset, dataOriginal]);

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
              disabled={isPristine || loading || saving}
              onClick={() => {
                const cloned = JSON.parse(dataOriginal);
                setDataset(cloned);
              }}
            >
              Reset
            </Button>
            <Button
              type="primary"
              disabled={isPristine || loading || saving}
              onClick={handleSubmit}
              loading={saving}
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
            paagination={false}
            // pagination={{
            //   total: totalCount,
            //   pageSize: 10,
            // }}
            rowKey="form_id"
          />
        </ConfigProvider>
      </Card>
    </div>
  );
};

export default React.memo(QuestionnairesAdmin);
