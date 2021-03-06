import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Table,
  ConfigProvider,
  Empty,
  Button,
  Tag,
} from "antd";
import {
  FileTextFilled,
  LoadingOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Breadcrumbs, DescriptionPanel, DataTab } from "../../components";
import { api, store, uiText } from "../../lib";
import { useNotification } from "../../util/hooks";

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Data Download",
  },
];
const descriptionData = (
  <p>
    This page shows your list of data export requests.
    <br />
    For exports which are already generated, please click on the Download button
    to download the data.
  </p>
);
const ExportData = () => {
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoadMore, setShowLoadMore] = useState(true);
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const { notify } = useNotification();
  const { forms } = store.useState((state) => state);
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const columns = [
    {
      render: (row) =>
        row.type === 1 ? (
          <img src="/assets/formtemplate.svg" />
        ) : (
          <FileTextFilled />
        ),
      width: 40,
    },
    {
      render: (row) => (
        <div>
          <div>
            <strong>{row.result}</strong>
          </div>
          <div>
            {forms.find((f) => f.id === row.info?.form_id)?.name || "-"}
          </div>
          <div>
            Filters: <Tag>None</Tag>
          </div>
        </div>
      ),
    },
    {
      dataIndex: "created",
    },
    {
      render: (row) => (
        <Row>
          <Button
            icon={
              row.status === "on_progress" || row.result === downloading ? (
                <LoadingOutlined />
              ) : row.status === "done" ? (
                <DownloadOutlined />
              ) : (
                <ExclamationCircleOutlined style={{ color: "red" }} />
              )
            }
            ghost
            disabled={row.status !== "done"}
            onClick={() => {
              handleDownload(row.result);
            }}
          >
            {row.status === "on_progress"
              ? text.generating
              : row.status === "failed"
              ? text.failed
              : text.download}
          </Button>
          <Button ghost className="dev">
            Delete
          </Button>
        </Row>
      ),
    },
  ];

  useEffect(() => {
    api
      .get(`download/list`)
      .then((res) => {
        setDataset(res.data);
        setLoading(false);
      })
      .catch((e) => {
        setLoading(false);
        setDataset([]);
        setShowLoadMore(false);
        notify({
          type: "error",
          message: text.errorFileList,
        });
        console.error(e);
      });
  }, [notify, text.errorFileList]);

  const pending = dataset.filter((d) => d.status === "on_progress");

  useEffect(() => {
    if (pending.length) {
      setTimeout(() => {
        api.get(`download/status/${pending?.[0]?.task_id}`).then((res) => {
          if (res?.data?.status === "done") {
            setDataset((ds) =>
              ds.map((d) =>
                d.task_id === pending?.[0]?.task_id
                  ? { ...d, status: "done" }
                  : d
              )
            );
          }
        });
      }, 300);
    }
  }, [pending]);

  const handleDownload = (filename) => {
    setDownloading(filename);
    api
      .get(`download/file/${filename}`, { responseType: "blob" })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        setDownloading(null);
      });
  };

  const onLoadMore = () => {
    setLoading(true);
    api
      .get(`download/list?page=${page + 1}`)
      .then((res) => {
        setDataset([...dataset, ...res.data]);
        if (res.data.length < 5) {
          setShowLoadMore(false);
        }
        setPage(page + 1);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setShowLoadMore(false);
        setLoading(false);
      });
  };

  const loadMore = () => {
    return showLoadMore && dataset.length > 0 ? (
      <Button type="link" onClick={onLoadMore}>
        Load More
      </Button>
    ) : !loading ? (
      <span className="text-muted">End of List</span>
    ) : null;
  };

  return (
    <div id="exportData">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          <DescriptionPanel description={descriptionData} />
        </Col>
      </Row>
      <DataTab />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 0 }}
      >
        <ConfigProvider renderEmpty={() => <Empty description="No data" />}>
          <Table
            columns={columns}
            dataSource={dataset}
            showHeader={false}
            rowClassName={(record) => (record.type === 1 ? "template" : "")}
            rowKey="id"
            loading={loading}
            footer={loadMore}
            pagination={false}
          />
        </ConfigProvider>
      </Card>
    </div>
  );
};

export default React.memo(ExportData);
