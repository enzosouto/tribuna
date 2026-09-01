/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "crests.football-data.org" },
      { protocol: "https", hostname: "**.thesportsdb.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "localhost", port: "4000" },
      // Uploaded avatars are served by the API. Add your production API host here too
      // (e.g. { protocol: "https", hostname: "your-api.onrender.com" }).
      { protocol: "https", hostname: "**.onrender.com" },
    ],
  },
};

export default nextConfig;
