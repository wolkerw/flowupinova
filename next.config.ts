
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'wlsmvzahqkilggnovxde.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

// Log the application URL for debugging purposes
if (process.env.APP_HOST) {
  console.log("==================================================");
  console.log("APP URL (for Cloud Scheduler):", process.env.APP_HOST);
  console.log("==================================================");
}

// Forcing a server restart to clear cache. This comment forces another restart.
export default nextConfig;
