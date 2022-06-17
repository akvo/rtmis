import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const AddUserTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/add-user/1.png",
            title: "A form to add a new user",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(AddUserTour);
