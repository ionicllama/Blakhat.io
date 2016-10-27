/**
 * Created by Evan on 9/27/2016.
 */

var errorHelpers = {
    returnError: function (resText, res, logErr) {
        if (logErr)
            console.log('Error Handled: ' + logErr);
        if (res && res.status)
            res.status(500).send(resText);
        else if (res)
            res.send(resText);
    },
    returnError_noId: function (res) {
        this.returnError("Missing required _id parameter.", res);
    }
};

module.exports = errorHelpers;