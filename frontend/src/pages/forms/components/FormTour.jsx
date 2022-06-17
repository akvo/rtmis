import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const FormTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/form/1.png",
            title: "A form to add new data",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(FormTour);
