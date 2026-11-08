import { createApp } from "./src/app";
import { deserialize } from "./src/lib/graph";

async function main() {
    const port = Number(process.env.PORT ?? 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT must be an integer between 1 and 65535");
    }

    await deserialize();
    const server = createApp().listen(port, () => {
        console.log(`Server started at http://localhost:${port}`);
    });
    server.requestTimeout = 15_000;
    server.headersTimeout = 10_000;
    server.on("error", error => {
        console.error("Server failed to listen:", error.message);
        process.exitCode = 1;
    });
}

main().catch(error => {
    console.error("Startup failed:", error.message);
    process.exitCode = 1;
});
