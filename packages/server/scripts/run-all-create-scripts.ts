import { spawn } from "child_process";
import { PrismaClient } from "@prisma/client";
import * as readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function runScript(scriptName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running ${scriptName}...`);
    console.log("=".repeat(50));
    
    const child = spawn("npx", ["tsx", `./scripts/${scriptName}`], {
      stdio: "inherit",
      shell: true,
      cwd: process.cwd(),
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptName} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${scriptName} failed with code ${code}`);
        reject(new Error(`${scriptName} failed with code ${code}`));
      }
    });

    child.on("error", (error) => {
      console.error(`❌ Error running ${scriptName}:`, error);
      reject(error);
    });
  });
}

async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connection successful");
    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw new Error("Cannot connect to database. Please ensure your database is running and migrations are applied.");
  }
}

async function runAllCreateScripts() {
  console.log("🎯 Starting all create scripts...");
  console.log("This will run the following scripts in order:");
  console.log("1. create-admin-user.ts (interactive)");
  console.log("2. create-sample-users.ts");
  console.log("3. assign-workflow-permissions.ts");
  console.log("4. create-sample-workflows.ts");
  console.log("5. create-sample-requests.ts");
  
  const proceed = await askQuestion("\nDo you want to proceed? (y/N): ");
  if (proceed.toLowerCase() !== "y" && proceed.toLowerCase() !== "yes") {
    console.log("❌ Operation cancelled");
    rl.close();
    return;
  }

  try {
    // Check database connection first
    await checkDatabaseConnection();

    // Run scripts in order
    await runScript("create-admin-user.ts");
    await runScript("create-sample-users.ts");
    await runScript("assign-workflow-permissions.ts");
    await runScript("create-sample-workflows.ts");
    await runScript("create-sample-requests.ts");

    console.log("\n🎉 All create scripts completed successfully!");
    console.log("\n📋 Summary of what was created:");
    console.log("✅ Admin user and role");
    console.log("✅ Sample users (manager, ceo, lawyer, finance, accountant, hr, initiator)");
    console.log("✅ Workflow permissions for all roles");
    console.log("✅ Sample workflow templates");
    console.log("✅ Sample workflow requests");
    
    console.log("\n🔗 You can now:");
    console.log("  - Login to the admin panel");
    console.log("  - Test workflow functionality");
    console.log("  - Use sample data for development");

  } catch (error) {
    console.error("\n❌ Error running create scripts:", error);
    console.log("\n💡 Troubleshooting tips:");
    console.log("  - Ensure your database is running");
    console.log("  - Run 'pnpm migrate' to apply database migrations");
    console.log("  - Check your environment variables");
    console.log("  - Run individual scripts to identify the issue");
  } finally {
    rl.close();
  }
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n\n⚠️  Process interrupted by user");
  rl.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n⚠️  Process terminated");
  rl.close();
  process.exit(0);
});

runAllCreateScripts(); 