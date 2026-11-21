import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Unggahan file (maks. 4 MB) lewat Server Action
    serverActions: { bodySizeLimit: '5mb' },
  },
}

export default nextConfig
