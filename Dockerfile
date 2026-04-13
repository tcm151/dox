FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json yarn.lock* ./
RUN corepack enable && yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
