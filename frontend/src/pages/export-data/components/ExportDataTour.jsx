import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const ExportDataTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/export-data/1.png",
            title: "Data to generate",
            description:
              "This is an item that has either in failed or successful exports",
          },
          {
            image: "/assets/tour/export-data/2.png",
            title: "Learn more",
            description: "See more exported data",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} title="Export data" />;
};

export default React.memo(ExportDataTour);
