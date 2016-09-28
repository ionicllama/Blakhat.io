/**
 * Created by Evan on 9/27/2016.
 */
var User = require('../models/user');
var AjaxResponse = require('../models/ajaxresponse');

var purchasingHelpers = {
    returnError: function (err, res) {
        console.log('Error Handled: ' + err);
        var response = new AjaxResponse({error: err.toString().replace('Error: ', '')});
        if (res)
            res.status(500).send(response.getResponse());
    }
};

module.exports = purchasingHelpers;