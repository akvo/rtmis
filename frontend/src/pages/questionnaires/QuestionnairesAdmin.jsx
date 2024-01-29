import React, { useMemo, useState, useEffect } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Table,
  ConfigProvider,
  Empty,
  Checkbox,
  Space,
  Button,
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
    link: "/control-center/approvals",
  },
  {
    title: "Manage Questionnaires Approvals",
  },
];

const QuestionnairesAdmin = () => {
  const { forms, levels, user } = store.useState((s) => s);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataset, setDataset] = useState([]);
  const [dataOriginal, setDataOriginal] = useState("");
  const { notify } = useNotification();

  const columns = useMemo(() => {
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
    return [
      {
        title: "Questionnaire",
        dataIndex: "form_id",
        render: (cell) => forms.find((f) => f.id === cell)?.name || "",
      },
      {
        title: "Questionnaire Description",
        dataIndex: "description",
        render: (cell) => cell || <span>-</span>,
      },
    ].concat(
      levels
        .filter((lv) => lv.level !== 0)
        .map((level) => {
          return {
            title: level.name,
            key: `lvl-${level.level}`,
            render: (row) => (
              <Checkbox
                checked={row.levels?.includes(level.level)}
                onChange={() => {
                  handleChecked(row.form_id, level.level);
                }}
              />
            ),
          };
        })
    );
  }, [levels, forms, dataset]);

  useEffect(() => {
    if (forms.length) {
      setLoading(true);
      api
        .get("form/approval-level")
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
      .put("form/approval", data)
      .then(() => {
        setSaving(false);
        notify({
          type: "success",
          message: "Questionnaires updated",
        });
        reloadData(user);
      })
      .catch(() => {
        notify({
          type: "error",
          message: "Could not update Questionnaires",
        });
        setSaving(false);
      });
  };

  const isPristine = useMemo(() => {
    return JSON.stringify(dataset) === dataOriginal;
  }, [dataset, dataOriginal]);

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
                pagination={false}
                // pagination={{
                //   total: totalCount,
                //   pageSize: 10,
                // }}
                rowKey="form_id"
              />
            </ConfigProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(QuestionnairesAdmin);
