# Go 1.21 Sandbox
FROM alpine:3.18

# Install Go
RUN apk add --no-cache go

# Security hardening
RUN find / -perm /6000 -type f -exec chmod a-s {} \; 2>/dev/null || true
RUN chmod -R go-w / 2>/dev/null || true

# Non-root user
RUN adduser -D -u 10000 sandbox

# Create workspace with proper ownership
RUN mkdir /workspace && chown sandbox:sandbox /workspace && chmod 755 /workspace
RUN chown sandbox:sandbox /tmp && chmod 1777 /tmp

USER sandbox
WORKDIR /workspace

CMD ["/bin/sh"]
