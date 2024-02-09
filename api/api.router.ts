import { Router } from "express";
import { hello } from "./routes/hello.route";
import { AssistantRoute } from "./routes/chatbot.route";
import { EljebaseRoute } from "./routes/eljbase.route";
import { UserRoute } from "./routes/user.route";

export function api(app: Router){
    hello(app);
    AssistantRoute(app);
    EljebaseRoute(app);
    UserRoute(app); 
}