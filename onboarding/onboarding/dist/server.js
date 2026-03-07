import express from "express";
import { fetchHalSchemaForms, postHalSchemaForms, sendHalSchemaForms, extractContextHeaders, } from "@hyperbench/shared/lib/fetch.js";
import { renderHalForms } from "@hyperbench/shared/renderer.js";
const ONBOARDING_API_URL = process.env.ONBOARDING_API_URL || "http://localhost:8082";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.all("/fragments/onboarding/*splat", async (req, res) => {
    try {
        const ctx = extractContextHeaders(req);
        const apiPath = req.path.replace("/fragments/", "/ui/");
        const query = new URLSearchParams(req.query).toString();
        const url = query
            ? `${ONBOARDING_API_URL}${apiPath}?${query}`
            : `${ONBOARDING_API_URL}${apiPath}`;
        let resource;
        if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
            resource = await sendHalSchemaForms(url, req.method, req.body, ctx);
        }
        else {
            resource = await fetchHalSchemaForms(url, ctx);
        }
        res.type("html").send(renderHalForms(resource));
    }
    catch (err) {
        res
            .status(502)
            .send(`<p>Error loading ${req.path}: ${String(err)}</p>`);
    }
});
// Also handle the root POST (create draft)
app.post("/fragments/onboarding", async (req, res) => {
    try {
        const ctx = extractContextHeaders(req);
        const resource = await postHalSchemaForms(`${ONBOARDING_API_URL}/ui/onboarding`, req.body, ctx);
        res.type("html").send(renderHalForms(resource));
    }
    catch (err) {
        res
            .status(502)
            .send(`<p>Error creating onboarding: ${String(err)}</p>`);
    }
});
const PORT = parseInt(process.env.PORT || "3003", 10);
app.listen(PORT, () => {
    console.log(`Onboarding service listening on http://localhost:${PORT}`);
});
