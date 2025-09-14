/** @type {import('next').NextConfig} */
const nextConfig = {
  // set asset prefix for API Gateway stage
  assetPrefix:
    process.env.NODE_ENV === 'production' ? `/${process.env.API_GATEWAY_STAGE}` : undefined,
  trailingSlash: false,
};

module.exports = nextConfig;
