import { Elysia } from "elysia"
import { swagger } from "@elysiajs/swagger"
import YAML from "js-yaml"
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
  .get("/openapi.yaml", async ({ server }) => {
    if (!server) return new Response("Server not ready", { status: 503 })
    const res = await server.fetch(new Request("http://localhost/docs/json"))
    const spec = await res.json()
    return new Response(YAML.dump(spec), {
      headers: { "content-type": "text/yaml; charset=utf-8" },
    })
  })
  .use(health)
  .use(time)
  .use(socialsRoute)
  .use(info)

export default app
