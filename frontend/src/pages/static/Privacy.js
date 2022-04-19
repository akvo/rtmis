import React from "react";
import Static from "./Static";

const data = [
  {
    title: "Section 1",
    level: 1,
  },
  {
    title: "Lorem ipsum dolor sit amet consectetur adipisicing elit",
    body: [
      "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
      "Perferendis non esse sint dolore corporis sit a vero nisi dolores blanditiis veritatis, cumque quibusdam asperiores at quaerat.",
      "Earum quam sint incidunt. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    ],
  },
  {
    title: "Lorem ipsum dolor sit amet consectetur adipisicing elit",
    body: [
      "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
      "Perferendis non esse sint dolore corporis sit a vero nisi dolores blanditiis veritatis, cumque quibusdam asperiores at quaerat.",
      "Earum quam sint incidunt. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    ],
  },
  {
    title: "Section 2",
    level: 1,
  },
  {
    title: "Lorem ipsum dolor sit amet consectetur adipisicing elit",
    body: [
      "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
      "Perferendis non esse sint dolore corporis sit a vero nisi dolores blanditiis veritatis, cumque quibusdam asperiores at quaerat.",
      "Earum quam sint incidunt. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    ],
  },
  {
    title: "Section 3",
    level: 1,
    body: [
      "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
      "Perferendis non esse sint dolore corporis sit a vero nisi dolores blanditiis veritatis, cumque quibusdam asperiores at quaerat.",
      "Earum quam sint incidunt. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    ],
  },
];

const Privacy = () => {
  return <Static title="Privacy Policy" data={data} />;
};

export default React.memo(Privacy);
