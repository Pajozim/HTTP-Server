import { Request, Response, NextFunction } from "express";


// validate chirp
// function ---------------------------------------------------------------------
export async function validate_chirp(req: Request, res: Response) {
    // Express body-parser already parsed the JSON for you
    const chirpContent = req.body.body; // Access the parsed body
    
    if (!chirpContent) {
        throw createError("BadRequestError", "Missing chirp content");
    }

    if (chirpContent.length > 140) {
        throw createError("BadRequestError", "Chirp is too long. Max length is 140");
    }

    const forbiddenWords = new Set(["kerfuffle", "sharbert", "fornax"]);
    const cC_split = chirpContent.split(" ").map((word: string) => { // cC = chirpContent
        return forbiddenWords.has(word.toLowerCase()) ? "****" : word;
    })
    const cC_cleaned = cC_split.join(" ");

    // Success response
    return {
        "cleanedBody": cC_cleaned,
        "valid": true,
        "status": 200
    };
}
// function end -----------------------------------------------------------------



// creating a chirp
// imports ----------------------------------------------------------------------
import { createChirp } from "../db/queries/chirps.js";
import { getBearerToken, validateJWT } from "./auth.js";
import { config, createError } from "../config.js";
// function ---------------------------------------------------------------------
export async function createChirpHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const oobtT: string = getBearerToken(req); // one of both types of token
    if (!oobtT) throw createError("BadRequestError", "no token found");
    let result: string;
    if (oobtT.match(/^[^.]+\.{1}[^.]+\.{1}[^.]+$/)) {
      const validation: JwtPayload = validateJWT(getBearerToken(req), config.jwt.secret);
      if (!validation || !validation.sub) throw createError("UnauthorizedError", "Verification Failed");
      result = validation.sub;
    }
    else return res.status(401).json({ "error": "Unauthorized" });
    const { cleanedBody } = await validate_chirp(req, res);
    const newChirpBody: NewChirp = { userId: result, body: cleanedBody };
    const chirpCreated = await createChirp(newChirpBody);
    return res.status(201).json(chirpCreated);
  } catch (error) {
    next(error); // Pass the error to Express
  }
}
// function end -----------------------------------------------------------------



// reading/retrieving all chrips
// imports ----------------------------------------------------------------------
import { retrieveAllChirps } from "../db/queries/chirps.js";
// function ---------------------------------------------------------------------
export async function readAllChirpsHandler(req: Request, res: Response) {
  const allORsome = req.query.authorId ?? null; // if query is empty, it returns null and therefore all chirps will be loaded, otherwise only chirps of the user will be loaded
  const orderBy = req.query.sort ?? "asc";
  if (allORsome) {
    return res.status(200).json(await retrieveAllChirps(orderBy as "desc" | "asc", allORsome as string));
  }
  return res.status(200).json(await retrieveAllChirps(orderBy as "desc" | "asc"));
}
// function end -----------------------------------------------------------------



// reading/retrieving one chirp
// imports ----------------------------------------------------------------------
import { retrieveChirp } from "../db/queries/chirps.js";
import { UUID } from "node:crypto";
import { NewChirp } from "../db/schema.js";
import { JwtPayload } from "jsonwebtoken";
// function ---------------------------------------------------------------------
export async function readChirpHandler(req: Request, res: Response) {
  const body = await retrieveChirp(req.params.chirpID as UUID);
  if (!body) {
    return res.status(404).json(
      {
        "error": "Chirp not found in database"
      }
    );
  }
  return res.status(200).json(body);
};
// function end -----------------------------------------------------------------



// deleting one chirp
// imports ----------------------------------------------------------------------
import { JsonWebTokenError } from "jsonwebtoken";
import { userExists } from "../db/queries/users.js";
import { deleteChirpFromDB } from "../db/queries/chirps.js";
// function ---------------------------------------------------------------------
export async function deleteChirp(req: Request, res: Response) {
  let validatedToken: JwtPayload;
  try {
      validatedToken = validateJWT(getBearerToken(req), config.jwt.secret);
  } catch (error: JsonWebTokenError | any ) {
      return res.status(401).json({
          "error": "Unauthorized access"
      })
  }
  if (!validatedToken.sub) return res.status(400).json({"error": "Missing id"});
  try {await userExists(validatedToken.sub)} 
  catch (error) { return res.status(400).json({"error": "Invalid id"}); }
  const result = await retrieveChirp(req.params.chirpID as UUID);
  if (!result) {
    return res.status(404).json(
      {
        "error": "Chirp not found in database"
      }
    );
  }
  if (result.userId !== validatedToken.sub) {
    return res.status(403).json(
      {
        "error": "Unauthorized to delete this chirp"
      }
    );
  }
  const rdChirp = await deleteChirpFromDB(req.params.chirpID as UUID); // returned deleted Chirp
  if (!rdChirp) {
    return res.status(404).json(
      {
        "error": "Chirp not found in database"
      }
  )}
  return res.status(204).json({ "deletedChirp": rdChirp });
}
// function end -----------------------------------------------------------------
