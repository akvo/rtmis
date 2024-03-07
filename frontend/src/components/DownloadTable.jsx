import React, { useState, useEffect, useMemo } from "react";
import { Table, ConfigProvider, Empty, Button, Space } from "antd";
import {
  FileTextFilled,
  LoadingOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  FileMarkdownFilled,
} from "@ant-design/icons";
import { api, store, uiText } from "../lib";
import { useNotification } from "../util/hooks";
import moment from "moment";

const DownloadTable = ({ type = "download" }) => {
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoadMore, setShowLoadMore] = useState(true);
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const { notify } = useNotification();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  useEffect(() => {
    const fetchData = (endpoint) => {
      setLoading(true);
      api
        .get(endpoint)
        .then((res) => {
          setDataset(res.data);
          setLoading(false);
        })
        .catch((e) => {
          setLoading(false);
          setShowLoadMore(false);
          setDataset([]);
          notify({
            type: "error",
            message: text.errorFileList,
          });
          console.error(e);
        });
    };
    if (type) {
      fetchData(`download/list?type=${type}`);
      return;
    }
    fetchData(`download/list`);
  }, [notify, text.errorFileList, type]);

  const handleDownload = (row) => {
    setDownloading(row.result);
    api
      .get(`download/file/${row.result}?type=${row.type}`, {
        responseType: "blob",
      })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", row.result);
        document.body.appendChild(link);
        link.click();
        setDownloading(null);
      });
  };

  useEffect(() => {
    const pending = dataset.filter((d) => d.status === "on_progress");
    let timeoutId = null;
    const updateStatus = () => {
      if (pending.length > 0) {
        timeoutId = setTimeout(() => {
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
            updateStatus();
          });
        }, 1000);
        return timeoutId;
      }
    };
    updateStatus();
    return () => {
      clearTimeout(timeoutId);
    };
  }, [dataset]);

  const onLoadMore = () => {
    setLoading(true);
    const url = type
      ? `download/list?type=${type}&page=${page + 1}`
      : `download/list?page=${page + 1}`;
    api
      .get(url)
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

  const columns = [
    {
      render: (row) =>
        row.category === "Administration" ? (
          <FileMarkdownFilled style={{ color: "blue" }} />
        ) : (
          <FileTextFilled style={{ color: "green" }} />
        ),
      width: 40,
    },
    {
      dataIndex: "category",
      render: (row) => (
        <div>
          <div>
            <strong>{row === "Data" ? "Data" : "Master Data"}</strong>
          </div>
          {row === "Data" ? null : row}
        </div>
      ),
    },
    {
      render: (row) => (
        <div>
          <div>
            <strong>{row.result}</strong>
          </div>
          {[row.form, row.administration].filter((x) => x).join(" | ")}
        </div>
      ),
    },
    {
      dataIndex: "date",
      render: (row) => (
        <span>{row ? row : moment().format("MMMM DD, YYYY hh:mm A")}</span>
      ),
    },
    {
      render: (row) => (
        <Space>
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
              handleDownload(row);
            }}
          >
            {row.status === "on_progress"
              ? text.generating
              : row.status === "failed"
              ? text.failed
              : text.download}
          </Button>
          <Button ghost className="dev">
            {text.deleteText}
          </Button>
        </Space>
      ),
    },
  ];

  return (
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
  );
};

export default DownloadTable;
