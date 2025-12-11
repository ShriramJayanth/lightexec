# Java 21 Sandbox
FROM alpine:3.18

# Install OpenJDK
RUN apk add --no-cache openjdk17

# Security hardening
RUN find / -perm /6000 -type f -exec chmod a-s {} \; 2>/dev/null || true
RUN chmod -R go-w / 2>/dev/null || true

# Create workspace
RUN mkdir /workspace && chmod 755 /workspace
WORKDIR /workspace

# Non-root user
RUN adduser -D -u 10000 sandbox
USER sandbox

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk

CMD ["/bin/sh"]
