var express = require('express');
var router = express.Router();

const fs = require('fs');
const path = require('path');
const correctionFolder = path.join(__dirname, '../correction');

/* GET home page. */
router.get('/', function(req, res, next) {

  fs.readdir(correctionFolder, (err, files) => {
    if(err)
      res.render('error', {message:correctionFolder, error:err});
    else
      res.render('index', { directories : files });
  })





});

module.exports = router;
