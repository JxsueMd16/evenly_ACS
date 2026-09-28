import { config } from "./config.js";
import { app } from "./app.js";

app.listen(config.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${config.PORT}`);
});
