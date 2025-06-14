//TODO: Adjust to match the new structure
module.exports = {
  apps: [
    {
      name: "API",
      script: "pnpm",
      args: "run start:server",
      env: {
        API_PORT: 8080,
      },
    },
    {
      name: "Client",
      script: "pnpm",
      args: "run start:client",
    },
    {
      name: "Admin",
      script: "pnpm",
      args: "run start:admin",
    },
  ],
};
