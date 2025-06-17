# README

Full system

The current tech stack consists of 3 workspaces set up using pnpm. Each workspace is described below:

1.  Client: Next.js
    - Tech stack: Next.js, React Query, shadcn/ui, react-hook-form, tRPC
2.  Admin: React.js (Vite)
    - Tech stack: React.js, React Query, MantineUI, react-hook-form, Zustand, tRPC, react-router
3.  Server: API with all the business logic
    - Tech stack: Node.js, Fastify, tRPC, Prisma, PostgreSQL

For authentication we use _Supabase_

The system utilizes pnpm to manage the workspaces and dependencies across the project.

## How to set everything up (locally)

1. Enter the repo and use `pnpm i` to install all the dependencies required for all the projects (workspaces).

2. Each project (workspace) requires its own set of environment variables to be set. In the root of each project (workspace), you can find a `.env.example` file which consists of all the variables required for the project to start. Replace empty values with the required keys and be sure to rename the file to `.env` or `.env.local` (for frontend's).

3. Make sure the database is set up and running. In our case, it's PostgreSQL.

4. After installing dependencies, filling all the required environment variables, and making sure the database is running, you can run the `pnpm dev` command inside the root of the repo. This will start all the projects in dev mode (with watch). After successful launch, you can access all the projects by their links specified below:

   1. Frontend at `http://localhost:3000`
   2. Admin panel at `http://localhost:5173`
   3. API at `http://localhost:8080`
   4. Prisma Studio at `http://localhost:5555`

## How to build and deploy the project

You will have to go over most of the steps used for local setup, including installing dependencies and filling all necessary **production** environment variables. After you have finished with the necessary steps (dependencies and environment variables), follow these additional steps:

1. Make sure to apply all the migrations. In the root of the repo, run the `pnpm migrate` command, which is equivalent to `npx prisma migrate deploy`.

2. If all the migrations applied successfully, make sure to generate a Prisma client by running `pnpm generate` in the root of the repo.

3. After that, build all the projects. In the root of the project, run `pnpm build` to start the build process for all of the projects.

4. The current setup uses [PM2](https://pm2.keymetrics.io/) to launch all the projects. For this, you have to install PM2 on the VM of choice. After successful installation, you can use the existing PM2 config `ecosystem.config.js`. You can start the PM2 process with this file using the `pm2 start ecosystem.config.js` command. Now all the projects should successfully start.

For the admin panel, NGINX is used to serve all the files. You can find the NGINX config in the config folder in the root of the repo, as well as other bash functions used to pull, build, and deploy each individual service.
