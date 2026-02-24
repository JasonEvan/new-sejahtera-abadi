import { NextRequest, NextResponse } from "next/server";
import { handleError } from "./handleError";

type RouteHandler<T = unknown> = (
  request: NextRequest,
  context: T,
) => Promise<NextResponse>;

export function withErrorHandler<TContext>(
  handler: RouteHandler<TContext>,
): RouteHandler<TContext> {
  return async function (
    request: NextRequest,
    context: TContext,
  ): Promise<NextResponse> {
    try {
      return await handler(request, context);
    } catch (error: unknown) {
      return handleError(error);
    }
  };
}
