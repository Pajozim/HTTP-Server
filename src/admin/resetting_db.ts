import { Request, Response } from "express";
import { resetDB } from "../db/queries/reset.js";
import { config } from "../config.js";

export function rDB_Handler(req: Request, res: Response) {
  let DB_reset = false;
  
  if (config.api.platform === "production") {
    return res.status(403).json({
      error: "Forbidden",
      db_reset: DB_reset
    });
  } else {
    void resetDB();
    DB_reset = true;
    console.log("Database reset");
  }

  res.status(200).json({
    "db_reset": DB_reset
  });
};