import { io } from "socket.io-client";
import { ENV_KEYS } from "./constants";

export const socket = io(ENV_KEYS.WS_URL);
