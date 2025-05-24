module.exports = {
  apps: [{
    name: "le-moissoneur",
    script: "./backend/dist/index.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    node_args: "--max-old-space-size=7168"
  }]
} 