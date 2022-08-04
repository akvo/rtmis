import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { Row, Col, Card, Divider, Space } from "antd";
import { Breadcrumbs, DescriptionPanel, UserTab } from "../../components";
import { api, store, uiText } from "../../lib";
import ApproverFilters from "../../components/filters/ApproverFilters";
import { SteppedLineTo } from "react-lineto";
import { take, takeRight } from "lodash";
import { useNotification } from "../../util/hooks";

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Manage Data Validation Setup",
  },
];

const ApproversTree = () => {
  const { administration, forms, selectedForm } = store.useState((s) => s);
  const [nodes, setNodes] = useState([]);
  const [dataset, setDataset] = useState([]);
  const [datasetJson, setDatasetJson] = useState("[]");
  const [scroll, setScroll] = useState(0);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  useEffect(() => {
    setNodes([
      {
        id: 0,
        name: "Questionnaire",
        children: forms
          .filter((f) => f.type === 1)
          .map((dt) => ({
            ...dt,
            user: null,
            active: false,
          })),
      },
    ]);
  }, [forms]);

  useEffect(() => {
    if (!!administration.length && selectedForm) {
      const selectedAdministration = takeRight(administration, 1)[0];
      setLoading(true);
      api
        .get(
          `form/approver/?administration_id=${selectedAdministration.id}&form_id=${selectedForm}`
        )
        .then((res) => {
          setDataset((prev) => {
            let adminClone = JSON.parse(JSON.stringify(prev));
            adminClone.length = administration.length - 1;
            adminClone = [
              ...adminClone,
              {
                id: selectedAdministration.id,
                childLevelName: selectedAdministration.childLevelName,
                children: res.data.map((cI) => ({
                  ...cI,
                  user: cI.user,
                })),
              },
            ];
            setDatasetJson(JSON.stringify(adminClone));
            return adminClone;
          });
          setLoading(false);
        })
        .catch(() => {
          notify({
            type: "error",
            message: "Could not fetch data",
          });
          setLoading(false);
        });
    }
  }, [administration, selectedForm, notify]);

  const isPristine = useMemo(() => {
    return JSON.stringify(dataset) === datasetJson;
  }, [dataset, datasetJson]);

  const handleColScroll = ({ target }) => {
    setScroll(target.scrollTop);
    const shade = takeRight(target.className.split(" "))[0];
    const shadeComponent = document.getElementById(`shade-for-${shade}`);

    if (target.scrollTop > 0) {
      shadeComponent.classList.add("on");
    } else {
      shadeComponent.classList.remove("on");
    }
  };

  const renderFormNodes = useMemo(() => {
    return nodes.map((nodeItem, i) => (
      <Col key={i} span={6} className="tree-col-0" align="center">
        {nodeItem.children.map((childItem, j) => (
          <div
            className={`tree-block tree-form-block-${childItem.id}
              ${
                childItem.id === selectedForm || nodeItem.id === selectedForm
                  ? "active"
                  : ""
              }`}
            key={j}
            onClick={() => {
              store.update((s) => {
                s.selectedForm = childItem.id;
                s.administration = take(administration);
              });
            }}
          >
            {childItem.name}
          </div>
        ))}
      </Col>
    ));
  }, [nodes, selectedForm, administration]);

  const renderAdminNodes = useMemo(() => {
    const handleClick = (e, index) => {
      if (!e || loading) {
        return;
      }
      setLoading(true);
      api
        .get(`administration/${e}`)
        .then((res) => {
          store.update((s) => {
            s.administration.length = index + 1;
            s.administration = [
              ...s.administration,
              {
                id: res.data.id,
                name: res.data.name,
                levelName: res.data.level_name,
                parent: res.data.parent,
                children: res.data.children,
                childLevelName: res.data.children_level_name,
              },
            ];
          });
          setLoading(false);
        })
        .catch(() => {
          notify({
            type: "error",
            message: "Could not load filters",
          });
          setLoading(false);
        });
    };
    return selectedForm
      ? administration.map(
          (adminItem, k) =>
            adminItem.children?.length > 0 && (
              <Col
                onScroll={handleColScroll}
                key={k}
                span={6}
                className={`tree-col-${k + 1}`}
                align="center"
              >
                {adminItem.children?.map((childItem, l) => {
                  const approver = dataset[k]?.children?.find(
                    (c) => c.administration.id === childItem.id
                  )?.user;
                  const approverName = approver
                    ? `${approver.first_name} ${approver.last_name}`
                    : text.notAssigned;
                  return (
                    <div
                      className={`tree-block tree-block-${k + 1}-${childItem.id}
                      ${
                        k >= administration.length - 1 ||
                        administration[k + 1]?.children[0]?.parent ===
                          childItem.id
                          ? "active"
                          : ""
                      }
                    `}
                      key={l}
                      onClick={() => {
                        if (
                          adminItem.levelName !==
                            takeRight(window.levels, 2)[0]?.name &&
                          administration[k + 1]?.children[0]?.parent !==
                            childItem.id
                        ) {
                          handleClick(childItem.id, k);
                        }
                      }}
                    >
                      <Space direction="vertical">
                        <div>{childItem.name}</div>
                        <h3 className={approver ? "" : "not-assigned"}>
                          {approverName}
                        </h3>
                      </Space>
                    </div>
                  );
                })}
              </Col>
            )
        )
      : "";
  }, [
    administration,
    dataset,
    selectedForm,
    loading,
    notify,
    text.notAssigned,
  ]);

  const renderFormLine = useMemo(() => {
    return (
      selectedForm &&
      !!administration.length && (
        <SteppedLineTo
          within="tree-col-0"
          key={`tree-line-${selectedForm}`}
          from={`tree-form-block-${selectedForm}`}
          to={`tree-col-0`}
          fromAnchor="right"
          toAnchor="right"
          delay={scroll ? 0 : 1}
          orientation="h"
          borderColor="#0058ff"
          borderStyle="solid"
        />
      )
    );
  }, [administration, selectedForm, scroll]);

  const renderAdminLines = useMemo(() => {
    return (
      selectedForm &&
      administration.map((adminItem, m) => (
        <div key={m}>
          {adminItem.children.map((childItem, ci) => {
            const isParent =
              administration[m + 1]?.children[0]?.parent === childItem.id;
            return (
              <div key={ci}>
                <SteppedLineTo
                  within={`tree-col-${m + 1}`}
                  key={`tree-line-${m + 1}-${childItem.id}`}
                  from={`tree-col-${m}`}
                  to={`tree-block-${m + 1}-${childItem.id}`}
                  fromAnchor="right"
                  toAnchor="left"
                  delay={scroll ? 0 : 1}
                  orientation="h"
                  borderColor={
                    m >= administration.length - 1 || isParent
                      ? "#0058ff"
                      : "#dedede"
                  }
                  borderStyle={
                    m >= administration.length - 1 || isParent
                      ? "solid"
                      : "dotted"
                  }
                  borderWidth={
                    m >= administration.length - 1 || isParent ? 1 : 1.5
                  }
                  zIndex={m >= administration.length - 1 || isParent ? 100 : 1}
                />
                {isParent && (
                  <SteppedLineTo
                    within={`tree-col-${m + 1}`}
                    key={`tree-line-p-${m}-${childItem.id}`}
                    from={`tree-block-${m + 1}-${childItem.id}`}
                    to={`tree-col-${m + 2}`}
                    fromAnchor="right"
                    toAnchor="left"
                    delay={scroll ? 0 : 1}
                    orientation="h"
                    borderColor="#0058ff"
                    borderStyle="solid"
                    zIndex={100}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))
    );
  }, [administration, selectedForm, scroll]);

  return (
    <div id="approversTree">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          <DescriptionPanel
            description={
              <>
                This is where you manage data validation for each Questionnaire.
                You can:
                <ul>
                  <li>Add data validator</li>
                  <li>Modify data validator</li>
                  <li>Delete data validator</li>
                </ul>
              </>
            }
          />
        </Col>
      </Row>
      <UserTab />
      <ApproverFilters
        loading={false}
        disabled={isPristine || loading}
        visible={false}
      />
      <Divider />
      <Card style={{ padding: 0, minHeight: "40vh" }}>
        <Row
          wrap={false}
          className={`tree-header ${loading ? "loading" : ""}`}
          justify="left"
        >
          <Col span={6} align="center">
            Questionnaire
          </Col>
          {selectedForm &&
            dataset.map(
              (aN, anI) =>
                !!aN?.children?.length && (
                  <Col key={anI} span={6} align="center">
                    {aN.childLevelName}
                    <div
                      className="shade"
                      id={`shade-for-tree-col-${anI + 1}`}
                    />
                  </Col>
                )
            )}
        </Row>
        <div className="tree-wrap" id="tree-wrap">
          <Row wrap={false} justify="left">
            {renderFormNodes}
            {renderAdminNodes}
            {renderFormLine}
            {renderAdminLines}
          </Row>
        </div>
      </Card>
    </div>
  );
};

export default React.memo(ApproversTree);
