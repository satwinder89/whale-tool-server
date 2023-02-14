const jwt = require('jsonwebtoken')

module.exports = {
  verifyToken: async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization
      if (typeof authHeader !== 'undefined') {
        const token = authHeader.split(' ')[1]
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
          if (err) {
            res.status(401).json({ message: 'Invalid token' })
          } else {
            // TODO: verifica l'indirizzo del wallet in modo sicuro, ad esempio confrontando con l'indirizzo del wallet corrente del cliente web3

            req.user = decoded
            next()
          }
        })
      } else {
        res.status(401).json({ message: 'Token not provided' })
      }
    } catch (e) {
      console.log(e)
    }
  },
}
