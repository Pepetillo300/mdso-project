# syntax=docker/dockerfile:1

########################
# Stage 1: dependencies / test
########################
FROM node:22-bookworm-slim AS build
WORKDIR /app

# No runtime dependencies, but keep the standard flow so adding deps later
# does not change the pipeline. --omit=dev keeps the runtime layer clean.
COPY app/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY app/ ./
# Normalize permissions. COPY preserves the source file modes, so a 0600 file
# in the build context produces an image the nonroot runtime user cannot read
# (EACCES on startup). Make the tree world-readable and directories traversable
# so the image no longer depends on the developer's local umask.
RUN chmod -R a+rX /app

# Fail the image build if the smoke tests fail: a broken image never reaches
# Artifact Registry, so it can never be rolled out to GKE.
RUN npm test

########################
# Stage 2: runtime
########################
# Distroless: no shell, no package manager, runs as UID 65532 (nonroot).
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runtime

# Injected by Cloud Build so the running pod can report exactly which commit
# it came from. Kept as ARG->ENV so they are visible at runtime.
ARG APP_VERSION=dev
ARG GIT_SHA=local
ARG BUILD_TIME=unknown
ENV APP_VERSION=${APP_VERSION} \
    GIT_SHA=${GIT_SHA} \
    BUILD_TIME=${BUILD_TIME} \
    NODE_ENV=production \
    PORT=8080

WORKDIR /app
# --chown is a second, independent guarantee: even if a mode slipped through,
# the runtime user owns the files.
COPY --from=build --chown=65532:65532 /app /app

USER 65532:65532
EXPOSE 8080

# Distroless nodejs images already have node as ENTRYPOINT.
CMD ["server.js"]
