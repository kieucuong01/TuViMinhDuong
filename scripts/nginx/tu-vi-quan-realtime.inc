location = /tu-vi-quan-ws {
    proxy_pass http://127.0.0.1:4101;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header X-Quan-Client-IP $remote_addr;
    proxy_set_header Cookie "";
    proxy_set_header Authorization "";
    proxy_read_timeout 45s;
    proxy_send_timeout 45s;
    proxy_cache off;
}
