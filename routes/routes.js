const router = require('express').Router()
const transactionsController = require('../controllers/transactions')

module.exports = () => {
  /**
   * @swagger
   * /getSwaps:
   *   get:
   *     summary: ritorna tutti gli swaps
   *     security:
   *        - bearerAuth: []
   *     parameters:
   *       - name: offset
   *         description: offset tabella
   *         in: query
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: swaps ritornati con successo
   */
  router.get('/getSwaps', transactionsController.getSwaps)
  return router
}
