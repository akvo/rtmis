import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const QuestionnaireTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/manage-user/3.png",
            title: "Search users",
            description: "Search user by name, country, organization and role",
          },
          {
            image: "/assets/tour/manage-user/1.png",
            title: "Add user",
            description: "A button to add a new user.",
          },
          {
            image: "/assets/tour/manage-user/2.png",
            title: "List of users",
            description: "A table to see the list of users.",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} title="Users" />;
};

export default React.memo(QuestionnaireTour);
