import { Request, Response, NextFunction } from "express";
import { storeEvent } from "../services/event.service";

export async function track(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { event_name, merchant_id, metadata } = req.body as {
      event_name: string;
      merchant_id: string;
      metadata?: Record<string, unknown>;
    };

    await storeEvent(event_name, merchant_id, metadata);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
