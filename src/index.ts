import { Elysia } from "elysia"
import { swagger } from "@elysiajs/swagger"
import { health } from "./routes/health"
import { time } from "./routes/time"
import { socialsRoute } from "./routes/socials"
import { info } from "./routes/info"

const app = new Elysia()
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "Fumi's Personal API",
          version: "1.0.0",
          description: "A personal serverless API",
        },
      },
    }),
  )
  .get("/", ({ redirect }) => redirect("/docs"))
  .use(health)
  .use(time)
  .use(socialsRoute)
  .use(info)

export default app
