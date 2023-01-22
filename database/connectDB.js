// db.js
const mongoose = require("mongoose");
const url =
  'mongodb+srv://whaletools:Whaletool123@whaledb.katkzqq.mongodb.net/'
const dbName = 'whaletools'

module.exports = {
  connectDB: async function () {
    try {
      //MONGOOSE DATABASE CONNECTION
      mongoose.Promise = global.Promise;
      mongoose.connect(url + dbName, {
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
