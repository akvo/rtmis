import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const AddUserTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/control-center/1.png",
            title: "List of Data to export",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(AddUserTour);
