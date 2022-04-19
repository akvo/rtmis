import React from "react";
import Static from "./Static";

const data = [
  {
    title: "1. Definitions",
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
    ],
  },
  {
    title: "2. Acknowledgement",
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
    title: "3. User Accounts",
    level: 1,
  },
  {
    title: "Lorem ipsum dolor sit amet consectetur adipisicing elit",
    body: ["Lorem ipsum dolor sit amet consectetur adipisicing elit."],
  },
  {
    title: "Lorem ipsum dolor sit amet consectetur adipisicing elit",
    level: 1,
    body: [
      "Perferendis non esse sint dolore corporis sit a vero nisi dolores blanditiis veritatis, cumque quibusdam asperiores at quaerat.",
      "Earum quam sint incidunt. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    ],
  },
  {
    title: "4. Content",
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
    level: 1,
    body: [
      "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
      "Perferendis non esse sint dolore corporis sit a vero nisi dolores blanditiis veritatis, cumque quibusdam asperiores at quaerat.",
      "Earum quam sint incidunt. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    ],
  },
  {
    title: "Footnote 1",
    level: 3,
    body: [
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis non esse sint dolore corporis sit a vero nisi dolores blanditiis veritatis, cumque quibusdam asperiores at quaerat.",
    ],
  },
  {
    title: "Footnote 2",
    level: 3,
    body: [
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Earum quam sint incidunt. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    ],
  },
];

const Terms = () => {
  return <Static title="Terms of Service" data={data} />;
};

export default React.memo(Terms);
