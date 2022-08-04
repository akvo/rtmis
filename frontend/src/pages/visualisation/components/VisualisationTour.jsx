import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const VisualisationTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/visualisation/1.png",
            title: "Select dropdown and Action buttons",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
          {
            image: "/assets/tour/visualisation/2.png",
            title: "Map",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
          {
            image: "/assets/tour/visualisation/3.png",
            title: "Section",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
          {
            image: "/assets/tour/visualisation/4.png",
            title: "Type of data",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} title="Visualization" />;
};

export default React.memo(VisualisationTour);
