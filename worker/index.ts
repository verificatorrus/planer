import type { AppVersion, ApiResponse } from './db-types';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Get current app version
    if (url.pathname === "/api/version") {
      try {
        const result = await env.DB.prepare(
          "SELECT * FROM app_version WHERE is_current = 1 ORDER BY created_at DESC LIMIT 1"
        ).first<AppVersion>();
        
        const response: ApiResponse<AppVersion | null> = {
          success: true,
          data: result || null,
        };
        return Response.json(response);
      } catch (error) {
        const response: ApiResponse<never> = {
          success: false,
          error: error instanceof Error ? error.message : "Database error",
        };
        return Response.json(response, { status: 500 });
      }
    }

    // Get all versions
    if (url.pathname === "/api/versions") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT * FROM app_version ORDER BY created_at DESC"
        ).all<AppVersion>();
        
        const response: ApiResponse<AppVersion[]> = {
          success: true,
          data: results,
        };
        return Response.json(response);
      } catch (error) {
        const response: ApiResponse<never> = {
          success: false,
          error: error instanceof Error ? error.message : "Database error",
        };
        return Response.json(response, { status: 500 });
      }
    }

    // Legacy endpoint for testing
    if (url.pathname.startsWith("/api/")) {
      return Response.json({
        name: `${env.MY_NAME}`,
        db_connected: true,
      });
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
