# Python 3.11 Sandbox
FROM alpine:3.18

# Install Python
RUN apk add --no-cache python3 py3-pip

# Security hardening
RUN find / -perm /6000 -type f -exec chmod a-s {} \; 2>/dev/null || true
RUN chmod -R go-w / 2>/dev/null || true

# Create workspace
RUN mkdir /workspace && chmod 755 /workspace
WORKDIR /workspace

# Non-root user
RUN adduser -D -u 10000 sandbox
USER sandbox

CMD ["/bin/sh"]
