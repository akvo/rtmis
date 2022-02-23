import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Select, message } from "antd";
import { api, store } from "../../lib";
import "./style.scss";
import { SteppedLineTo } from "react-lineto";
import { take, takeRight } from "lodash";

const { Option } = Select;
const users = [
  {
    id: 1,
    name: "A. Awiti",
  },
  {
    id: 2,
    name: "Kerubo Stacy",
  },
  {
    id: 3,
    name: "Kimeli. K",
  },
  {
    id: 4,
    name: "Kipsang Kipchoge",
  },
  {
    id: 5,
    name: "Maina Mwangi",
  },
];

const TreeRenderer = ({ nodes }) => {
  const { administration, selectedForm } = store.useState((state) => state);
  const [adminNodes, setAdminNodes] = useState([]);
  const [scroll, setScroll] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const adminClone = administration.map((adminNode) => ({
      ...adminNode,
      user: null,
      active: false,
      children: [...adminNode.children].map((aN) => ({ ...aN, active: false })),
    }));
    for (let i = 0; i < adminClone.length - 1; i++) {
      const pos = adminClone[i].children.findIndex(
        (c) => c.name === adminClone[i + 1].name
      );
      if (pos !== -1) {
        adminClone[i].children[pos].active = true;
      }
    }
    setAdminNodes(adminClone);
  }, [administration]);

  const userMenu = useMemo(() => {
    return (
      <Select
        value={1}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {users.map((user, userIndex) => (
          <Option key={userIndex} value={user.id}>
            {user.name}
          </Option>
        ))}
      </Select>
    );
  }, []);

  const handleClick = (e, index) => {
    if (!e) {
      return;
    }
    setLoading(true);
    api
      .get(`administration/${e}/`)
      .then((res) => {
        store.update((s) => {
          s.administration.length = index + 1;
          s.administration = [
            ...s.administration,
            {
              id: res.data.id,
              name: res.data.name,
              levelName: res.data.level_name,
              children: res.data.children,
            },
          ];
        });
        setLoading(false);
      })
      .catch((err) => {
        message.error("Could not load filters");
        setLoading(false);
        console.error(err);
      });
  };

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

  const renderNodes = useMemo(() => {
    return (
      <Row wrap={false} justify="left">
        {nodes.map((nodeItem, i) => (
          <Col key={i} span={6} className="tree-col-0" align="center">
            {nodeItem.children.map((childItem, j) => (
              <div
                className={`tree-block tree-form-block-${childItem.id}
                  ${
                    childItem.id === selectedForm ||
                    nodeItem.id === selectedForm
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
        ))}
        {selectedForm &&
          adminNodes.map(
            (adminItem, k) =>
              adminItem.children?.length > 0 && (
                <Col
                  onScroll={handleColScroll}
                  key={k}
                  span={6}
                  className={`tree-col-${k + 1}`}
                  align="center"
                >
                  {adminItem.children.map((childItem, l) => (
                    <div
                      className={`tree-block tree-block-${k}-${childItem.id}
                      ${childItem.active ? "active" : ""}`}
                      key={l}
                      onClick={() => {
                        if (!loading) {
                          handleClick(childItem.id, k);
                        }
                      }}
                    >
                      <div>{childItem.name}</div>
                      {userMenu}
                    </div>
                  ))}
                </Col>
              )
          )}

        {selectedForm && (
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
        )}

        {selectedForm &&
          adminNodes.map((adminItem, m) => (
            <div key={m}>
              {adminItem.children.map((childItem) => {
                const isParent =
                  adminNodes[m + 1]?.children[0]?.parent === childItem.id ||
                  false;
                return (
                  <>
                    <SteppedLineTo
                      within={`tree-col-${m + 1}`}
                      key={`tree-line-${m + 1}-${childItem.id}`}
                      from={`tree-col-${m}`}
                      to={`tree-block-${m}-${childItem.id}`}
                      fromAnchor="right"
                      toAnchor="left"
                      delay={scroll ? 0 : 1}
                      orientation="h"
                      borderColor={
                        childItem.active || m >= adminNodes.length - 1
                          ? "#0058ff"
                          : "#dedede"
                      }
                      borderStyle={
                        childItem.active || m >= adminNodes.length - 1
                          ? "solid"
                          : "dotted"
                      }
                      borderWidth={
                        childItem.active || m >= adminNodes.length - 1 ? 1 : 1.5
                      }
                      zIndex={
                        childItem.active || m >= adminNodes.length - 1 ? 100 : 1
                      }
                    />
                    {isParent && (
                      <SteppedLineTo
                        within={`tree-col-${m + 1}`}
                        key={`tree-line-${m}-${childItem.id}`}
                        from={`tree-block-${m}-${childItem.id}`}
                        to={`tree-col-${m + 1}`}
                        fromAnchor="right"
                        toAnchor="right"
                        delay={scroll ? 0 : 1}
                        orientation="h"
                        borderColor="#0058ff"
                        borderStyle="solid"
                        zIndex={100}
                      />
                    )}
                  </>
                );
              })}
            </div>
          ))}
      </Row>
    );
  }, [
    nodes,
    adminNodes,
    selectedForm,
    loading,
    userMenu,
    administration,
    scroll,
  ]);

  return (
    <>
      <Row wrap={false} className="tree-header" justify="left">
        <Col span={6} align="center">
          Questionnaire
        </Col>
        {selectedForm &&
          adminNodes.map(
            (aN, anI) =>
              aN.children.length > 0 && (
                <Col key={anI} span={6} align="center">
                  {aN.levelName}
                  <div className="shade" id={`shade-for-tree-col-${anI + 1}`} />
                </Col>
              )
          )}
      </Row>
      <div className="tree-wrap" id="tree-wrap">
        {renderNodes}
      </div>
    </>
  );
};

export default React.memo(TreeRenderer);
