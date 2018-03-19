'use strict'

var express = require('express')
var db = require('../db')
var helpers = require('./helpers')



module.exports = express()
  .set('view engine', 'ejs')
  .set('views', 'view')
  .use(express.static('static'))
  .use('/image', express.static('db/image'))
  // TODO: Serve the images in `db/image` on `/image`.
  .get('/', all)
  /* TODO: Other HTTP methods. */
  //.post('/', add)
  .get('/:id', get)
  //.put('/:id', set)
  //.patch('/:id', change)
  //.delete('/:id', remove)
  .listen(1902)

function all(req, res) {
  var result = {errors: [],
    data: db.all()
  }

  /* Use the following to support just HTML:  */
  res.render('list.ejs', Object.assign({}, result, helpers))

  /* Support both a request for JSON and a request for HTML  */
  // res.format({
  //   json: () => res.json(result),
  //   html: () => res.render('list.ejs', Object.assign({}, result, helpers))
  // })
}


function get(req, res) {

  //door req.param worden alle projecten die uit de url zijn gekomen in een var gestopt.
  var id = req.params.id
  // hier krijg je data van de database. In dit geval vragen we niet alles op, maar alleen de id uits de functie get.
  var result = {errors: [], data: db.get(id)}
  // Toegang krijgen tot detail.ejs (een template) waardoor je toegang krijgt tot die data.
  res.render('detail.ejs', Object.assign({}, result, helpers))

  res.render('error.ejs',Object.assign( { error: err }, result, helpers))



}
