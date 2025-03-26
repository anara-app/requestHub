import { QueueBaseOptions } from "bullmq";
import { CONSTANTS } from "../common/constants";

export const QUEUE_WORKER_CONNECTION: QueueBaseOptions["connection"] = {
  host: CONSTANTS.REDIS.HOST,
  port: +CONSTANTS.REDIS.PORT,
};

export const QUEUE_KEYS = {
  UPDATE_ARTICLES_VIEWS: "UPDATE_ARTICLES_VIEWS",
};
