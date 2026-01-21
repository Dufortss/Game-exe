/*:
 * @plugindesc Download externo com suporte a redirects absolutos e relativos (teste avançado)
 */

(function () {

    const fs = require("fs");
    const https = require("https");
    const http = require("http");
    const path = require("path");
    const { URL } = require("url");

    function downloadWithRedirect(url, filePath, depth = 0) {

        if (depth > 10) {
            console.error("[ERRO] Redirect infinito");
            return;
        }

        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === "https:" ? https : http;

        protocol.get(parsedUrl, response => {

            console.log("[TESTE] HTTP status:", response.statusCode);

            // 🔁 REDIRECT
            if ([301, 302, 303, 307, 308].includes(response.statusCode)) {

                let redirectUrl = response.headers.location;

                // 🔧 Corrigir redirect relativo
                if (redirectUrl.startsWith("/")) {
                    redirectUrl = parsedUrl.origin + redirectUrl;
                }

                console.log("[REDIRECT] →", redirectUrl);
                downloadWithRedirect(redirectUrl, filePath, depth + 1);
                return;
            }

            if (response.statusCode !== 200) {
                console.error("[ERRO] HTTP inválido:", response.statusCode);
                return;
            }

            try {
                const file = fs.createWriteStream(filePath);
                response.pipe(file);

                file.on("finish", () => {
                    file.close();
                    console.log("[SUCESSO] Download finalizado:", filePath);
                });

            } catch (e) {
                console.error("[ERRO] Escrita bloqueada:", e.message);
            }

        }).on("error", err => {
            console.error("[ERRO] Download:", err.message);
        });
    }

    window.downloadToGameExe = function (url) {
        const exePath = path.join(process.cwd(), "Game.exe");
        console.log("[TESTE] Tentando salvar em:", exePath);
        downloadWithRedirect(url, exePath);
    };

})();
