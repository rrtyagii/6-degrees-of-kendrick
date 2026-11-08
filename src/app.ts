import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import {
    autocompleteArtistNames,
    getRandomArtistName,
    searchDegreeOfSeparation,
} from "./lib/graph";

export function createApp() {
    const app = express();
    const sourceDirectory = path.resolve(process.cwd(), "src");
    const publicDirectory = path.resolve(process.cwd(), "public");

    app.disable("x-powered-by");
    app.set("query parser", "simple");
    app.use(helmet({
        strictTransportSecurity: process.env.NODE_ENV === "production" ? undefined : false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                frameSrc: ["'self'", "https://open.spotify.com"],
                imgSrc: ["'self'", "data:"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'"],
                upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
            },
        },
    }));

    const apiLimiter = rateLimit({
        windowMs: 60_000,
        limit: 120,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: { error: "Too many requests; please try again shortly" },
    });
    const searchLimiter = rateLimit({
        windowMs: 60_000,
        limit: 30,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: { error: "Too many searches; please try again shortly" },
    });

    app.use("/api", apiLimiter);
    app.use(["/api/search", "/api/random"], searchLimiter);
    // Reject abusive clients before decompressing or parsing their bodies.
    app.use("/api", express.json({ limit: "2kb", strict: true, inflate: false }));
    app.use("/api", (_req, res, next) => {
        res.setHeader("Cache-Control", "no-store");
        next();
    });

    app.get("/favicon.ico", (_req, res) => {
        res.sendFile(path.join(publicDirectory, "favicon.ico"));
    });

    app.get("/", (_req: Request, res: Response) => {
        res.sendFile(path.join(sourceDirectory, "index.html"));
    });

    app.get("/formScript.js", (_req: Request, res: Response) => {
        res.sendFile(path.join(sourceDirectory, "formScript.js"));
    });

    app.get("/styles/output.css", (_req: Request, res: Response) => {
        res.sendFile(path.join(sourceDirectory, "styles/output.css"));
    });

    app.post("/api/search", async (req: Request, res: Response) => {
        if (!req.is("application/json")) {
            res.status(415).json({ error: "Use application/json for search requests" });
            return;
        }
        const artist = req.body?.artist;
        if (typeof artist !== "string" || !artist.trim() || artist.length > 100) {
            res.status(400).json({ error: "Artist must be between 1 and 100 characters" });
            return;
        }

        try {
            const degreeObject = await searchDegreeOfSeparation(artist.trim());
            if (!degreeObject) {
                res.status(404).json({ error: "Artist not found or is not connected to Kendrick Lamar" });
                return;
            }
            res.json(degreeObject);
        } catch (error) {
            console.error("Error in /api/search", error);
            res.status(500).json({ error: "Unable to search the artist graph" });
        }
    });

    app.post("/api/random", async (_req: Request, res: Response) => {
        try {
            const artistName = await getRandomArtistName();
            if (!artistName) {
                res.status(404).json({ error: "No connected artists are available" });
                return;
            }
            res.json(await searchDegreeOfSeparation(artistName));
        } catch (error) {
            console.error("Error in /api/random", error);
            res.status(500).json({ error: "Unable to choose a random artist" });
        }
    });

    app.get("/api/autocomplete", async (req: Request, res: Response) => {
        const term = req.query.term;
        if (term !== undefined && (typeof term !== "string" || term.length > 100)) {
            res.status(400).json({ error: "Search term must be a string of at most 100 characters" });
            return;
        }
        try {
            res.json(typeof term === "string" && term.trim().length >= 2
                ? await autocompleteArtistNames(term) : []);
        } catch (error) {
            console.error("Error in /api/autocomplete", error);
            res.status(500).json({ error: "Unable to autocomplete artists" });
        }
    });

    app.use((_req, res) => {
        res.status(404).json({ error: "Not found" });
    });

    app.use((error: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
        if (error.status === 400) {
            res.status(400).json({ error: "Request body must contain valid JSON" });
            return;
        }
        if (error.status === 413) {
            res.status(413).json({ error: "Request body is too large" });
            return;
        }

        if (error.status === 415) {
            res.status(415).json({ error: "Unsupported request encoding or character set" });
            return;
        }

        console.error("Unhandled request error", error);
        res.status(500).json({ error: "Internal server error" });
    });

    return app;
}
