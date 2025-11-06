export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return Response.json({
        name: `${env.MY_NAME}`,
      });
    }
		return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
