#!/bin/sh

# Remove 'https://' from WEBDOMAIN if present
WEBDOMAIN=${WEBDOMAIN#https://}

cat << EOF > /traefik-config/dynamic.yml
http:
  routers:
    frontend-service-router-80:
      rule: "Host(\`${WEBDOMAIN}\`)"
      service: frontend-service
      entrypoints: web
      middlewares:
        - redirect-to-https

    frontend-service-router-443:
      entrypoints:
        - websecure
      rule: "Host(\`${WEBDOMAIN}\`)"
      service: frontend-service
      tls:
        certResolver: myresolver
      middlewares:
        - redirect-documentation

  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: "https"
        permanent: true

    redirect-documentation:
      redirectRegex:
        regex: "^https://${WEBDOMAIN}/documentation$"
        replacement: "https://${WEBDOMAIN}/documentation/"
        permanent: true

  services:
    frontend-service:
      loadBalancer:
        servers:
          - url: "http://localhost:81"
EOF