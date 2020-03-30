'use strict';
var crypto = require("crypto");
var constants = require("constants");

/**
 * insert public certificate
 *  you can get one from safaricom daraja
 * @type {string}
 */
const publicCertificate = ``


module.exports.encrypt_text = async (event, context, callback) => {
  var bufferToEncrypt = Buffer.from(event["text"]);

  var encrypted = crypto.publicEncrypt({
      "key": publicCertificate, 
      padding: constants.RSA_PKCS1_PADDING
    },
    bufferToEncrypt
  );

  var payload = {
    "encrypted": encrypted.toString("base64"),
  };

  return payload;
};
