FROM oven/bun:latest AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:latest
RUN apt-get update -qq && apt-get install -y -qq git && rm -rf /var/lib/apt/lists/*
ENV NO_COLOR=1
ENV NODE_NO_COLORS=1
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
