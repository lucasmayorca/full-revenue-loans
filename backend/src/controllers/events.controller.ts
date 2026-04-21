import { Request, Response, NextFunction } from "express";
import { storeEvent, listEvents, computeMetrics } from "../services/event.service";

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

/** GET /events — listado de eventos recientes con filtros opcionales */
export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { since, event_name, session_id, limit } = req.query as {
      since?: string;
      event_name?: string;
      session_id?: string;
      limit?: string;
    };
    const parsedLimit = limit ? Math.min(parseInt(limit, 10) || 0, 5000) : 500;
    const results = listEvents({
      since,
      eventName: event_name,
      sessionId: session_id,
      limit: parsedLimit,
    });
    res.json({ count: results.length, events: results });
  } catch (err) {
    next(err);
  }
}

/** GET /events/metrics — agregados listos para dashboard */
export async function metrics(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json(computeMetrics());
  } catch (err) {
    next(err);
  }
}
