import React, { useMemo } from "react";
import "./style.scss";
import { Row, Col, Card, Timeline, Typography } from "antd";
import { store, uiText } from "../../lib";
const { Paragraph } = Typography;

const updates = [
  {
    title: "Lorem ipsum dolor sit amet consectetur adipisicing elit",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis non esse sint dolore corporis sit a vero nisi dolores blanditiis veritatis, cumque quibusdam asperiores at quaerat. Earum quam sint incidunt. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  },
  {
    title: "Lorem ipsum dolor sit amet consectetur adipisicing elit",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis non esse sint dolore corporis sit a vero nisi dolores blanditiis veritatis, cumque quibusdam asperiores at quaerat. Earum quam sint incidunt. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  },
  {
    title: "Lorem ipsum dolor sit amet consectetur adipisicing elit",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis non esse sint dolore corporis sit a vero nisi dolores blanditiis veritatis, cumque quibusdam asperiores at quaerat. Earum quam sint incidunt. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  },
  {
    title: "Lorem ipsum dolor sit amet consectetur adipisicing elit",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis non esse sint dolore corporis sit a vero nisi dolores blanditiis veritatis, cumque quibusdam asperiores at quaerat. Earum quam sint incidunt. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  },
];
const events = [
  {
    title: "Lorem ipsum dolor sit amet",
    date: "01 May 2022",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis non esse sint dolore corporis sit a vero nisi dolores blanditiis veritatis, cumque quibusdam asperiores at quaerat. Earum quam sint incidunt.",
  },
  {
    title: "Lorem ipsum dolor sit amet",
    date: "08 May 2022",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis non esse sint dolore corporis sit a vero nisi dolores blanditiis veritatis, cumque quibusdam asperiores at quaerat. Earum quam sint incidunt.",
  },
  {
    title: "Lorem ipsum dolor sit amet",
    date: "25 May 2022",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis non esse sint dolore corporis sit a vero nisi dolores blanditiis veritatis, cumque quibusdam asperiores at quaerat. Earum quam sint incidunt.",
  },
  {
    title: "Lorem ipsum dolor sit amet",
    date: "04 Jun 2022",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis non esse sint dolore corporis sit a vero nisi dolores blanditiis veritatis, cumque quibusdam asperiores at quaerat. Earum quam sint incidunt.",
  },
];

const NewsEvents = () => {
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  return (
    <div id="news-events">
      <h1>{text.eventTitle}</h1>
      <Row gutter={[36, 16]}>
        <Col xs={24} sm={24} md={24} lg={16} xl={16}>
          <h2>{text.latestUpdateText}</h2>
          <div className="updates">
            {updates.map((u, uI) => (
              <Card bodystyle={{ padding: 0 }} key={uI} className="update">
                <h3>{u.title}</h3>
                <div>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <div className="placeholder" />
                    </Col>
                    <Col span={16}>{u.description}</Col>
                  </Row>
                </div>
              </Card>
            ))}
          </div>
        </Col>
        <Col xs={24} sm={24} md={24} lg={8} xl={8}>
          <h2>{text.upcomingEventText}</h2>
          <div className="events">
            <Timeline>
              {events.map((e, eI) => (
                <Timeline.Item key={eI}>
                  <div className="event">
                    <h3>{e.title}</h3>
                    <div>{e.date}</div>
                    <div className="placeholder" />
                    <Paragraph
                      ellipsis={{ rows: 3, expandable: true, symbol: "more" }}
                    >
                      {e.description}
                    </Paragraph>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(NewsEvents);
