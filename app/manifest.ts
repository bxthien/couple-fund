import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CoupleFund",
    short_name: "CoupleFund",
    description: "Ứng dụng quản lý quỹ chung cho cặp đôi",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/couple-fund.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/couple-fund.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/couple-fund.png",
        sizes: "180x180",
        type: "image/png",
      }
    ],
  };
}
