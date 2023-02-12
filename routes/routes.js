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
   *       - name: gtValue
   *         description: volume swap maggiore di $
   *         in: query
   *         required: true
   *         type: string 
   *     responses:
   *       200:
   *         description: swaps ritornati con successo
   */
  router.get('/getSwaps', transactionsController.getSwaps)
  /**
   * @swagger
   * /getNFTs:
   *   get:
   *     summary: ritorna tutti gli NFTs swaps
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
   *         description: NFTs swaps ritornati con successo
   */
  router.get('/getNFTs', transactionsController.getNFTs)
  return router
}
