'use strict'

var express = require('express')
var db = require('../db')
var helpers = require('./helpers')
var path = require('path')
var bodyParser = require('body-parser')
var slug = require('slug')
var multer = require('multer')

// var storage = multer.diskStorage({
//   destination: './db/image/',
//   filename: function(req, file, cb){
//     cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//   }
// })
//
// var upload = multer({
//   storage: storage,
//   limits:{fileSize: 1000000},
//   // fileFilter: function (req, file, cb){
//   //   checkFileType(file, cb)
//   // }
// }). single('cover')

//check file type
// function checkFileType(file, cb){
//   // Allowed extensions
//   var filetypes = /jpeg|jpg|png|gif/
//   // Check extensions
//   var extname = filetypes.test(path.extname(file.originalname).toLowerCase)
//   // Check mimetype
//   var mimetype = filetypes.test(file.mimetype)
//
//   if (mimetype && extname) {
//     return cb(null, true)
//   } else {
//     cb('Error: Images Only!')
//   }
// }

var ejs = require('ejs')

module.exports = express()
  .set('view engine', 'ejs')
  .set('views', 'view')
  .use(express.static('static'))
  // Body parser parst de data die je opstuurt met een formulier en maakt daar bijvoorbeeld numbers van.
  .use(bodyParser.urlencoded({
    extended: true
  }))
  .use('/image', express.static('db/image'))

  // TODO: Serve the images in `db/image` on `/image`.
  .get('/add', renderForm)
  .get('/', all)
  /* TODO: Other HTTP methods. */
  .post('/', add)
  .delete('/:id', remove)
  .get('/:id', get)
  // .post('/db/image', add)
  //.put('/:id', set)
  //.patch('/:id', change)
  .listen(1902)

function all(req, res) {
  var result = {
    errors: [],
    data: db.all()
  }

  /* Use the following to support just HTML:  */
  res.render('list.ejs', Object.assign({}, result, helpers))

  /* Support both a request for JSON and a request for HTML  */
  // res.format({
  //  json: () => res.json(result),
  //  html: () => res.render('list.ejs', Object.assign({}, result, helpers))
  // })
}

function get(req, res) {
  //Door req.param worden alle projecten die uit de url zijn gekomen in een var gestopt.
  var id = req.params.id
  var has // Variable wordt hier aangemaakt

  try {
    if (db.has(id)) {
      // Hier krijg je data van de database. In dit geval vragen we niet alles op, maar alleen de id uit de functie get.
      var result = {
        errors: [],
        data: db.get(id)
      }
      // Toegang krijgen tot detail.ejs (een template) waardoor je toegang krijgt tot die data.
      // .json en ejs opvragen
      // res.format staat op deze plek, omdat je in de if data opvraagd en je daarom een json of html bestand terug moet krijgen. Hij 'werkt' alleen hier.
      // Bij de error hoeft dit niet, want dan er is geen data om op te vragen.
      res.format({
        json: () => res.json(result),
        html: () => res.render('detail.ejs', Object.assign({}, result, helpers))
      })
    } else if (db.removed(id)) {
      var result = {
        errors: [{
          id: 410,
          title: 'Gone',
          detail: 'Gone'
        }]
      }
      res.status(410).render('error.ejs', Object.assign({}, result, helpers))
    } else {
      var result = {
        errors: [{
          id: 404,
          title: '404 not found',
          detail: 'Sorry we could not find this page.'
        }]
      }
      res.status(404).render('error.ejs', Object.assign({}, result, helpers))
    }
  } catch (err) {
    var result = {
      errors: [{
        id: 400,
        title: '400 bad request',
        detail: 'Oops something went wrong.'
      }]
    }
    res.status(400).render('error.ejs', Object.assign({}, result, helpers))
    return
  }
}

function remove(req, res, next) {
  var id = req.params.id

  var result = {
    errors: [],
    data: db.all()
  }
  try {
    if (db.removed(id)) {
      console.log('Dier is al verwijderd')
      var result = {
        errors: [{
          id: 400,
          title: '400 bad request',
          detail: 'Oops something went wrong.'
        }]
      }
      res.status(400).render('error.ejs', Object.assign({}, result, helpers))
      // 400 je dier is al verwijderd
    } else {
      db.remove(id)
      console.log('Het dier is zojuist verwijderd')
      var result = {
        errors: [{
          id: 204,
          title: 'No Content',
          detail: 'Het dier is verwijderd'
        }]
      }
      res.status(204).render('error.ejs', Object.assign({}, result, helpers))
      // 204 dier verwijderd
    }
  } catch (err) {
    console.log('Dier bestaat niet')
    return next()
    // 404 niks gevonden
  }
}

// Deze functie is voor het formulier, hierbij laat je toe dat als ze /add in de browser typen,
// Dat je bij form.ejs komt en dus het form kan invullen
function renderForm(req, res) {
  res.render('form.ejs')
}

// Deze functie zorgt ervoor dat de gegevens die zijn ingevuld in het formulier, in de database worden gezet
// Daardoor kan er een detailpagina van worden gemaakt
function add(req, res, next) {
  // upload(req, res, (err) => {
  //   if (err) {
  //     res.render('form.ejs', {
  //       msg: err
  //     });
  //   } else {
  //     if(req.file == undefined){
  //       res.render('form.ejs', {
  //         msg: 'Error: No File Selected'
  //       })
  //     } else {
  //       res.render('detail.ejs', {
  //         msg: 'File Uploaded',
  //         file: `image/${req.file.filename}`
  //       })
  //     }
  //   }
  // })

  var form
  try {
    // In de variabele form, geef je cleanForm, dat is een functie, daarin geef je req.body aan mee
    // req.body is alles wat je terugkrijgt van het formulier
    form = cleanForm(req.body)
    // De functie cleanForm veranderd de gegevens naar wat nettere gegevens en die geeft ze weer terug
    // In de console krijg je form te zien, oftewel alle gegevens die zijn ingevuld in het formulier
    console.log(form)
    // Hier voeg je form toe aan je db dmv. db.add. Dus de gegevens komen hierdoor in de database te staan
    form = db.add(form)
    // Dan redirect je naar de detailpagina van het nieuwe dier, door '/' te doen en dan de nieuwe gegevens in form
    // te linken aan een id. id is het nummer van het dier dus dat zie je in de browser
    res.redirect('/' + form.id)
  } catch (err) {
    console.log(err)
    // Als het niet werkt door iets dan wordt er een error gegeven, vandaar dat er next in de parameters wordt gegeven
    return next()
  }
}

// De functie cleanForm, schoont alle gegevens op die string zijn en bijvoorbeeld een Boolean of Number moeten zijn
// Je geeft inputForm aan mee omdat je de input van het form wilt gebruiken in deze functie
function cleanForm(inputForm) {
  // In de var form geef je dus inputForm mee, dat zijn dus de gegevens
  var form = inputForm
  // Dan selecteer je de bepaalde elementen in form die moeten worden veranderd, met form.vaccinated
  // dus vaccinated, declawed, age en weight moeten worden veranderd van string naar Boolean of number
  // Nadat je dat hebt aangegeven, zet je na de '=' de bepaalde content type die je aan dat element mee wilt geven
  // En daarin selecteer je weer de form elementen die erbij horen
  form.vaccinated = Boolean(form.vaccinated)
  form.declawed = Boolean(form.declawed)
  form.age = Number(form.age)
  form.weight = Number(form.weight)

  if (form.type === "cat") {
    form.declawed = Boolean(form.declawed)
  } else {
    form.declawed = undefined
  }

  // De gegevens moeten wel weer worden teruggegooid omdat je ze nog nodig hebt, dus daarom gebruik je return
  return form
}
