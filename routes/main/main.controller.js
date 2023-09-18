const bsc = require("../../config/bsc");
const qs = require("querystring");
const { Curl, curly } = require("node-libcurl");

exports.main = async (req, res, next) => {
  const { statusCode, data, headers } = await curly.get(
    `${bsc.URL}/info?api_token=${bsc.token}`
  );
  console.log("statusCode ", statusCode);
  console.log("data", data);
  console.log("headers", headers);
  res.end();

  // const curl = new Curl();
  // curl.setOpt("URL", "www.google.com");
  // curl.setOpt("FOLLOWLOCATION", true);

  // curl.on("end", (statusCode, data, headers) => {
  //   console.info(statusCode);
  //   console.info("---");
  //   console.info(data.length);
  //   console.info("---");
  //   console.info(curl.getInfo("TOTAL_TIME"));

  //   curl.close();
  // });
  // curl.on("error", curl.close.bind(curl));
  // curl.perform();

  // res.end();
};
