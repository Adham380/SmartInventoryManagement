var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const http = require("http");
const https = require("https");
const axios = require("axios");
const querystring = require("querystring");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/hello', function(req, res, next) {
    res.send('Ich mache was! :P');
})

//get from upcitemdb api free version
async function getBarcodeInfo(barcode) {
   const url = "https://api.upcitemdb.com/prod/trial/lookup?upc=" + barcode;
   const options = {
         method: "GET",
            headers: {
                    "Content-Type": "application/json"

            }

   }
    try {
        const response = await axios.get(url, options);
        const data = await response.data;
        console.log(data);
        return data;
    }
    catch (error) {
        console.log(error);
    }
}
let items = ["oil", "salt", "pepper", "chicken", "tomato", "onion", "garlic", "cheese", "sriracha", "basmati rice"];
//spoonacular api call. Get ingredients from text
async function extractIngredientList(text) {
    const ingredientText = items.join("\n");
    const apiUrl = "https://api.spoonacular.com/recipes/parseIngredients?apiKey=6e1e5b3c0e34460b8b4ac864c2b36ed7&language=en";

    const formData = querystring.stringify({
        'ingredientList': ingredientText,
    });

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: formData,
        url: apiUrl
    };

    try {
        const response = await axios(options);
        const data = response.data;
        // console.log(data);
        return data;
    } catch (error) {
        console.log(error);
    }
}
//spoonacular api call. Get recipe based on ingredients, number of recipes and diet
async function getRecipe(ingredients, number, diet) {
    const url = "https://api.spoonacular.com/recipes/findByIngredients?ingredients=" + ingredients + "&number=" + number + "&diet=" + diet + "&apiKey=6e1e5b3c0e34460b8b4ac864c2b36ed7";
    const options = {
        method: "GET",
        headers: {
            "Content-Type": "application/json"

        }
    }
    try {
        const response = await axios.get(url, options);
        const data = await response.data;
        console.log(data);
        return data;
    }
    catch (error) {
        console.log(error);
    }
}

app.post('/getRecipe', async function (req, res, next) {
    // const ingredients = req.body.ingredients;
    // const number = req.body.number;
    // const diet = req.body.diet;
    //get all items.title from items array
    const ingredients = items.map(item => item.title)
    // const ingredients = "chicken, tomato, onion, garlic, salt, pepper, oil"
    // console.log(ingredients);
    // console.log(text)
    const ingredientList = await extractIngredientList(ingredients);
    const ingredientListNames = ingredientList.map(ingredient => ingredient.name);
    const recipe = await getRecipe(ingredientListNames, 1, undefined);
    console.log(recipe);
    res.send(recipe);
})
//receives a post request from the client and adds the new item to the database by using the barcode to identify the item
app.post('/addNewItem', async function (req, res, next) {
    // console.log(req.body);
    const barcode = req.body.barcode;
    // console.log(barcode);
    // console.log(req.body)
    //call barcode api to get item information
    const itemInfo = await getBarcodeInfo(barcode);
    items.push(itemInfo.items[0])
    //add item to database
    // console.log(itemInfo);
    res.send('Item added to database');
})
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
