const express = require("express");
const app = express();
const port = 3000;

const bodyParser = require("body-parser");
const routes = require("./routes");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/", routes);

app.listen(port, () => {
  console.log(`=========== app listening on port ${port} ==============`);
});
