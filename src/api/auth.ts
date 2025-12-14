import argon2 from "argon2";

// password to hash
// function ---------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
    try {
        const hash = await argon2.hash(password);
        return hash;
    } catch (err) {
        throw new Error("Failed to hash password");
    }
}
// function end -----------------------------------------------------------------



// password to check upon
export async function checkPasswordHash(hash: string, password: string): Promise<boolean> {
    if (await argon2.verify(hash, password)) {
        return true;
    } else {
        console.log("false");
        return false;
    }
}
// function end -----------------------------------------------------------------



// user Sign-In
// imports ---------------------------------------------------------------------
import { Request, Response } from "express";
import { NewUser } from "../db/schema.js";
import { createUser } from "../db/queries/users.js";
import { createRfToken } from "../db/queries/refreshTokens.js";
import { createError } from "../config.js";
// function ---------------------------------------------------------------------
export async function userSignIn(req: Request, res: Response) {
  const body = req.body;
  if (!body) {
    createError("BadRequestError", "email and password required");
  } else {
    const hashedPW = await hashPassword(body.password);
    const resultUser: NewUser | null = await createUser({ ...body, password: hashedPW });
    if (!resultUser || !resultUser.id) {
      return res.status(400).json({
        "error": "User already exists"
      });
    }
    const rfTokenStruct: newToken | null = { user_id: resultUser.id, token: makeRefreshToken() };
    const rfToken = await createRfToken(rfTokenStruct);
    if (!rfToken) {
        return res.status(500).json({
            "error": "Failed to create refresh token. Try again."
        })
    }
    type UserWOPW = Omit<NewUser, "password">; // User without password
    const { password, ...uWOPW } = resultUser;
    const userData: UserWOPW & { refreshToken: string } = { ...uWOPW as UserWOPW, refreshToken: rfToken.token };
    return res.status(201).json(userData);
  }
}
// function end -----------------------------------------------------------------



// user login
// imports ---------------------------------------------------------------------
import { User, newToken, token } from "../db/schema.js";
import { userExists } from "../db/queries/users.js";
import { config } from "../config.js";
import { retrieveRfTbU } from "../db/queries/refreshTokens.js";
// function ---------------------------------------------------------------------
export async function userLogin(req: Request, res: Response) {
    try {
        const email = req.body.email;
        const uPassword = req.body.password;
        const existingUser: User | null = await userExists(email);
        if (!existingUser) {
            return res.status(404).json({
                "error": "User not found"
            });
        }
        const pw_checked: boolean = await checkPasswordHash(existingUser.password?.toString() as string, uPassword);
        if (!pw_checked) {
        return res.status(401).json({"error": "Incorrect password"});
        }
        let rfToken: token | null = await retrieveRfTbU(existingUser.id);
        if (!rfToken) {
            return res.status(400).json({
                "error": "Unauthorized access"
            })
        }
        type UwaTawoPW = Omit<User, "password"> & { token: string, refreshToken: string }; // type: user with all tokens (access | refresh) and without password
        const tokens = { token: makeJWT(existingUser.id, 60 * 60, config.jwt.secret) , refreshToken: rfToken.token };
        const { password, ...userData } = existingUser;
        const userWaTaWTPW: UwaTawoPW = { ...userData, ...tokens }; // user with all tokens (access | refresh) and without password
        return res.status(200).json(userWaTaWTPW);
    } catch (error) {
        return res.status(500).json({
            "error": `Internal Server Error: ${error}`
        })
    }
};
// function end -----------------------------------------------------------------



// JWT
// imports ---------------------------------------------------------------------
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
// generate a (JSON web) Token
// function ---------------------------------------------------------------------
export function makeJWT(userID: string, expiresIn: number, secret: string): string {
    type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;
    const payload = {
        iss: "chirpy",
        sub: userID, // which is UUID
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresIn,
    }
    return jwt.sign(payload, secret); // output example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjaGlycHkiLCJzdWIiOiJ0ZXN0VXNlcjEwMCIsImlhdCI6MTc2MzA3NTk3MSwiZXhwIjoxNzYzMDc5NTcxfQ.-W-d-rH7cFFy0bG4PPXuGfhddqWQXy_bHavd3DoUG1k
};
// function end -----------------------------------------------------------------



// validate a (JSON web) Token
// function ---------------------------------------------------------------------
export function validateJWT(tokenString: string, secret: string): JwtPayload {
    return jwt.verify(tokenString, secret) as JwtPayload; // output example: { iss: 'chirpy', sub: '${UUID}', iat: 1763075971, exp: 1763075971 };
};
// function end -----------------------------------------------------------------



// get Bearer Token
// function ---------------------------------------------------------------------
export function getBearerToken(req: Request): string {
  const rawInput = req.get("Authorization");
  if (!rawInput) throw new Error("Missing Authorization header");
  if (!rawInput.startsWith("Bearer ")) throw new Error("Invalid Authorization header");

  const token = rawInput.slice("Bearer ".length).trim();
  if (!token) throw new Error("Missing token");
  return token;
}
// function end -----------------------------------------------------------------



// generate Refresh tokens
// imports ---------------------------------------------------------------------
import crypto from "node:crypto";
// function ---------------------------------------------------------------------
export function makeRefreshToken(): string {
    return crypto.randomBytes(256).toString('hex'); // 256 bits to Buffer of Bytes to hex
}
// function end -----------------------------------------------------------------



// refresh token
// imports ---------------------------------------------------------------------
import { retrieveRfTbT } from "../db/queries/refreshTokens.js";
// function ---------------------------------------------------------------------
export async function refreshTokenHandler(req: Request, res: Response) {
    const rfToken: string = getBearerToken(req);
    const retrievedToken: token | null = await retrieveRfTbT(rfToken);
    if (!retrievedToken || retrievedToken.revoked_at || new Date() > retrievedToken.expires_at) {
        return res.status(401).json({
            "error": "Unauthorized access"
        });
    }
    return res.status(200).json({
        "token": makeJWT(retrievedToken.user_id, 3600, config.jwt.secret)
    });
}
// function end -----------------------------------------------------------------



// revoke refreshToken
// imports ---------------------------------------------------------------------
import { revokeRfT } from "../db/queries/refreshTokens.js";
// function ---------------------------------------------------------------------
export async function revokeRFThandler(req: Request, res: Response) {
    const rfToken: string = getBearerToken(req);
    const retrievedToken: token | null = await retrieveRfTbT(rfToken);
    if (!retrievedToken) {
        return res.status(400).json({
            "error": "no token found"
        });
    }
    const nRFtoken: token = { ...retrievedToken, revoked_at: new Date() };
    const result: token | null = await revokeRfT(nRFtoken);
    if (!result || !result.revoked_at) {
        return res.status(500).json({
            "error": "Internal Server Error"
        });
    }
    return res.status(204).json();
}
// function end -----------------------------------------------------------------




// updating account credentials
// imports ---------------------------------------------------------------------
import { userUpdate } from "../db/queries/users.js";
import { JsonWebTokenError } from "jsonwebtoken";
// function ---------------------------------------------------------------------
export async function updateAccount(req: Request, res: Response) {
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
    const password = req.body.password;
    const hashedPW = await hashPassword(password);
    console.log("\nvalidatedToken", validatedToken, "---", validatedToken.sub, "----", typeof(validatedToken.sub), "\n");
    const updatedUser: NewUser | null = await userUpdate({ id: validatedToken.sub, email: req.body.email, password: hashedPW });
    console.log("\nupdatedUser", updatedUser, "\n");
    if (!updatedUser || !updatedUser.id) {
        return res.status(400).json({
            "error": "User not found"
        });
    }
    const updatedUserWOPW: Omit<NewUser, "password"> = { password, ...updatedUser };
    // I would assume, an obligatory logout is important
    return res.status(200).json(updatedUserWOPW);
}
// function end -----------------------------------------------------------------
