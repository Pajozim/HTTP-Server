import { Request, Response } from "express";



// polka webhook about user upgrade
// imports ----------------------------------------------------------------------
import { createError } from "../config.js";
import { userUpgradeTCR } from "../db/queries/users.js";
import { config } from "../config.js";
// function ---------------------------------------------------------------------
export async function userToUpgrade(req: Request, res: Response) {
    const PolkaAK = await getAPIKey(req); //Polka API Key
    const PAKvalidated = PolkaAK === config.api.polkaAPIKey; // Polka API Key validated
    if (!PAKvalidated) {
        return res.status(401).json({
            "error": "Unauthorized access"
        });
    }
    const body = req.body;
    if (!body) {
        createError("BadRequestError", "no content found");
    }
    if (body.event !== "user.upgraded") {
        return res.status(204).json({});
    }
    const result = await userUpgradeTCR(body.data.userId);
    if (!result) {
        return res.status(404).json({
            "error": "User not found"
        })
    }
    return res.status(204).json({});
}
// function end -----------------------------------------------------------------


// polka API key
// imports ----------------------------------------------------------------------
// function ---------------------------------------------------------------------
export async function getAPIKey(req: Request): Promise<string | null> {
    const rawInput = req.get("Authorization");
    if (!rawInput || !rawInput.startsWith("ApiKey ")) throw createError("UnauthorizedError", "Invalid Authorization header");

    return rawInput.slice("ApiKey ".length).trim();
}
// function end -----------------------------------------------------------------