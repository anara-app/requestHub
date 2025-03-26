module.exports = {
  apps: [
    {
      name: "API",
      script: "npm",
      args: "run start:server",
      env: {
        API_PORT: 8080,
      },
    },
    {
      name: "Client",
      script: "npm",
      args: "run start:client",
    },
  ],
};
