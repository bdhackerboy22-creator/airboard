import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.1.121',
    '192.168.1.121:3000',
    'localhost:3000',
    '*.loca.lt',
    '*.ngrok-free.app',
    'https://silver-paws-act.loca.lt',
    'https://airboard-iota.vercel.app'
  ]
};

export default nextConfig;
