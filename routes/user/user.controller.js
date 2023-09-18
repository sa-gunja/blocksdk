// const mysql = require("mysql");
// const db = mysql.createConnection(dbconfig);
const mysql = require("mysql2/promise");
const dbconfig = require("../../config/database");
const bsc = require("../../config/bsc");
const { Curl, curly } = require("node-libcurl");
const request = require("request-promise-native");

exports.main = (req, res, next) => {
  res.send("user main");
};

exports.createUser = async (req, res, next) => {
  const userId = req.body.id;
  const password = req.body.pw;

  if (!userId || !password) {
    res.send({ state: 400, msg: "계정 또는 비밀번호를 입력하세요." });
    res.end();
  }

  try {
    const { statusCode, data, headers } = await curly.post(
      `${bsc.URL}/address/?api_token=${bsc.token}`,
      {
        postFields: JSON.stringify({
          name: userId,
        }),
        httpHeader: [
          "Content-Type: application/json",
          "Accept: application/json",
        ],
      }
    );

    // console.log(data);
    if (data.state.code !== 200 && !data.state.success) {
      res.send({ state: data.state.code, msg: "계정 생성 실패", data: [] });
      res.end();
    }
    const { id, name, address, privateKey } = data.payload;

    const conn = await mysql.createConnection(dbconfig);
    const [rows, fields] = await conn.execute(
      `INSERT INTO BSC_USER (userId, password, id, address, privateKey, date)
      VALUES ('${name}','${password}','${id}','${address}','${privateKey}',NOW())`,
      []
    );

    res.send({
      state: data.state.code,
      msg: "계정이 생성되었습니다.",
      data: data.payload,
    });

    res.end();
  } catch (error) {
    console.log(error);
    res.send({ state: 400, msg: "createUser Exception Error", data: [] });
  }
};

exports.userInfo = async (req, res, next) => {
  console.log(req.params.id);
  try {
    const conn = await mysql.createConnection(dbconfig);
    const [rows, fields] = await conn.execute(
      `SELECT * FROM BSC_USER WHERE userId = '${req.params.id}'`,
      []
    );

    const { statusCode, data, headers } = await curly.get(
      `${bsc.URL}/address/${rows[0].address}/info?api_token=${bsc.token}&offset=0&limit=10&order_direction=desc&rawtx=false`
    );

    console.log("statusCode", statusCode);
    console.log("data", data);

    res.end();
  } catch (error) {
    console.log(error);
    res.send({ state: 400, msg: "userInfo Exception Error", data: [] });
  }
};

exports.list = async (req, res, next) => {
  try {
    const conn = await mysql.createConnection(dbconfig);
    const [rows] = await conn.execute(
      "SELECT * FROM BSC_USER ORDER BY seq DESC",
      []
    );

    console.log(rows);

    res.send({ state: 200, msg: "", data: rows });
    res.end();
  } catch (error) {
    console.log(error);
    res.send({ state: 400, msg: "list Exception Error", data: [] });
  }
};

exports.send = async (req, res, next) => {
  const { fromUser, toUser, amount } = req.body;

  try {
    const conn = await mysql.createConnection(dbconfig);
    let [rows] = await conn.execute(
      `select * from BSC_USER where userId in (?,?)`,
      [fromUser, toUser]
    );

    console.log("rows", rows);

    const fromAddress = rows[0].address;
    const toAddress = rows[1].address;
    const privateKey = rows[0].privateKey;
    const gas_limit = "90000";

    // console.log(`${fromAddress} / ${toAddress} / ${privateKey} / ${gas_limit}`);

    let sendData = new FormData();
    sendData.append("private_key", privateKey);
    sendData.append("to", toAddress);
    sendData.append("amount", amount);
    sendData.append("gas_limit", gas_limit);

    const url = `${bsc.URL}/address/${fromAddress}/send?api_token=${bsc.token}`;

    const opt = {
      url: url,
      method: "POST",
      form: {
        private_key: privateKey,
        to: toAddress,
        amount: amount,
        gas_limit: gas_limit,
      },
    };

    let result = await request(opt);
    result = JSON.parse(result);
    rows = await conn.execute(
      `INSERT INTO BSC_TRANS_HISTORY (from_id, to_id, amount, hash, date) VALUES (?,?,?,?, NOW())`,
      [fromUser, toUser, amount, result.payload.hash]
    );

    res.send({
      state: 200,
      msg: `${toUser} 님에게 ${amount} wei 전송 완료`,
      data: result.payload,
    });
    res.end();
  } catch (error) {
    console.log(error);
    res.send({ code: 400, msg: "코인 전송에 문제가 발생했습니다.", data: [] });
  }
};

exports.history = async (req, res, next) => {
  const { userId } = req.params;

  const conn = await mysql.createConnection(dbconfig);
  const [rows] = await conn.execute(
    `SELECT * FROM BSC_TRANS_HISTORY WHERE (from_id = ? or to_id = ?) ORDER BY date DESC`,
    [userId, userId]
  );

  // let send = [];
  // let get = [];

  // for (const i of rows) {
  //   if (i["from_id"] === userId) {
  //     send.push(`${i.to_id} 에게 ${i.amount} 만큼 보냄`);
  //     console.log(`${i.to_id} 에게 ${i.amount} 만큼 보냄`);

  //     send.push({ ...i });
  //   } else if (i["to_id"] === userId) {
  //     get.push(`${i.from_id} 에게 ${i.amount} 만큼 받음`);
  //     console.log(`${i.from_id} 에게 ${i.amount} 만큼 받음`);
  //   }
  // }

  // console.log(send);
  // console.log(get);
  res.send({ state: 200, msg: "", data: rows });
  res.end();
};
