import { Elysia } from "elysia"
import { health } from "./routes/health"
import { time } from "./routes/time"
import { socialsRoute } from "./routes/socials"
import { info } from "./routes/info"

const app = new Elysia()
  .use(health)
  .use(time)
  .use(socialsRoute)
  .use(info)

export default app
