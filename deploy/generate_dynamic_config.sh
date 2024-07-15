#!/bin/sh
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
    redirect-to-https:
      redirectScheme:
        scheme: "https"
        permanent: true


  services:
    frontend-service:
      loadBalancer:
        servers:
          - url: "http://localhost:81"
EOF