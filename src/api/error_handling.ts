import { Request, Response, NextFunction } from "express";
import { errorClasses } from "../config.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error("Uh oh, spaghetti-o (" + err + ")");
  if (err instanceof errorClasses.BadRequestError) {
    res.status(400).json({
      "error": err.message
    });
  } 
  else if (err instanceof errorClasses.UnauthorizedError) {
    res.status(401).json({
      "error": err.message
    });
  }
  else if (err instanceof errorClasses.ForbiddenError) {
    res.status(403).json({
      "error": err.message
    });
  }
  else if (err instanceof errorClasses.NotFoundError) {
    res.status(404).json({
      "error": err.message
    });
  }
  else {
    console.log("Internal Server Error");
    res.status(500).json({
      "error": err.message
    });
  }
}