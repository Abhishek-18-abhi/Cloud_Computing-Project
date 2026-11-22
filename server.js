import app from "./backend/src/server.js";

const port = Number(process.env.PORT || 5000);

if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`Server listening on ${port}`));
}

export default app;
