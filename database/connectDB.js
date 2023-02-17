const mongoose = require("mongoose");
require('dotenv').config()

module.exports = {
  connectDB: async function () {
    try {
      //MONGOOSE DATABASE CONNECTION
      mongoose.Promise = global.Promise;
      mongoose.connect(process.env.DATABASE, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    } catch (e) {
      logger.error(e);
    }
  },

  endConnection: function () {
    try {
      mongoose.connection.close();
    } catch (e) {
      logger.error(e);
    }
  },
};
