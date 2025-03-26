//Main start
export async function startAllWorkers() {
  try {
    console.log("All workers started successfully");
  } catch (error) {
    console.log("Workers failed to start");
    console.log(error);
  }
}
