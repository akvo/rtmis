import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const UploadDataTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/control-center/1.png",
            title: "Updating existing data",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
          {
            image: "/assets/tour/control-center/2.png",
            title: "Download / Upload",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
          {
            image: "/assets/tour/control-center/2.png",
            title: "Browsing to your computer",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(UploadDataTour);
