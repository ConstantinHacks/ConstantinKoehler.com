const express = require('express')
const app = express()
app.set('view engine', 'ejs')

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.render('index');
})

app.get('/work', function (req, res) {
  res.render('work');
})

app.listen(process.env.PORT || 5000, function () {
  console.log('process.env.PORT')
})