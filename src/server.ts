import config from "./config";
import app from "./app";
import { initDB } from "./db";

const main = () => {
  initDB();
  app.listen(config.port, () => {
    console.log(`The server is running on port : ${config.port}`);
  });
};
main();
