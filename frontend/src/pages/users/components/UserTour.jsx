import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const QuestionnaireTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/manage-user/1.png",
            title: "Add user",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
          {
            image: "/assets/tour/manage-user/3.png",
            title: "Search users",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
          {
            image: "/assets/tour/manage-user/2.png",
            title: "List of users",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(QuestionnaireTour);
