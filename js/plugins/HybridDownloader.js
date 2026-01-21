/*:
 * @plugindesc Downloader híbrido (Browser + Game.exe) com redirect seguro
 */

(function () {

    // Detecta NW.js (Game.exe)
    function isNW() {
        return typeof require === "function" && typeof process !== "undefined";
    }

    // ============================
    // ===== MODO NAVEGADOR =======
    // ============================

    function browserDownload(url) {

        console.log("[BROWSER] Iniciando download:", url);

        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener";

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        if (window.$gameMessage) {
            $gameMessage.add("Download aberto no navegador.");
        }
    }

    // ============================
    // ===== MODO GAME.EXE ========
    // ============================

    function nwDownload(url) {

        const fs = require("fs");
        const https = require("https");
        const http = require("http");
        const path = require("path");
        const { URL } = require("url");

        function downloadWithRedirect(url, filePath, depth = 0) {

            if (depth > 10) {
                console.error("Redirect infinito");
                return;
            }

            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === "https:" ? https : http;

            protocol.get(parsedUrl, response => {

                if ([301,302,303,307,308].includes(response.statusCode)) {

                    let redirectUrl = response.headers.location;

                    if (redirectUrl.startsWith("/")) {
                        redirectUrl = parsedUrl.origin + redirectUrl;
                    }

                    console.log("[REDIRECT]", redirectUrl);
                    downloadWithRedirect(redirectUrl, filePath, depth + 1);
                    return;
                }

                if (response.statusCode !== 200) {
                    console.error("HTTP inválido:", response.statusCode);
                    return;
                }

                const file = fs.createWriteStream(filePath);
                response.pipe(file);

                file.on("finish", () => {
                    file.close();
                    console.log("Download concluído:", filePath);

                    if (window.$gameMessage) {
                        $gameMessage.add("Download finalizado.");
                    }
                });

            }).on("error", err => {
                console.error("Erro download:", err);
            });
        }

        const exePath = path.join(process.cwd(), "Game.exe");
        console.log("Salvando em:", exePath);

        downloadWithRedirect(url, exePath);
    }

    // ============================
    // ===== FUNÇÃO GLOBAL ========
    // ============================

    window.downloadToGameExe = function(url) {

        if (isNW()) {
            console.log("[MODO] Game.exe");
            nwDownload(url);
        } else {
            console.log("[MODO] Navegador");
            browserDownload(url);
        }

    };

    // ============================
    // ===== EXECUTAR EXE ========
    // ============================

    window.runDownloadedGame = function() {

        if (!isNW()) {
            console.warn("Browser não permite executar EXE");
            if (window.$gameMessage) {
                $gameMessage.add("No navegador não é possível abrir programas.");
            }
            return;
        }

        const { exec } = require("child_process");
        exec('start "" "Game.exe"', { shell: true });

        console.log("Game.exe executado");
    };

})();
