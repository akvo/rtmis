import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { Row, Col, Table, ConfigProvider, Empty, Button, Tag } from "antd";
import {
  FileTextFilled,
  LoadingOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { api, store, uiText } from "../../lib";
import { useNotification } from "../../util/hooks";

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

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.dataDownloadTitle,
    },
  ];

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
            shape="round"
            type="primary"
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
        {text.loadMoreLable}
      </Button>
    ) : !loading ? (
      <span className="text-muted">{text.endOfListLabel}</span>
    ) : null;
  };

  return (
    <div id="exportData">
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={text.exportPanelText}
              title={text.dataDownloadTitle}
            />
          </Col>
        </Row>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <div
            style={{ padding: 0, minHeight: "40vh" }}
            bodystyle={{ padding: 0 }}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ExportData);
