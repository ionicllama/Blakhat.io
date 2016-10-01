/**
 * Created by Evan on 9/27/2016.
 */

var errorHelpers = {
    returnError: function (resText, res, logErr) {
        if (logErr && logErr.length > 0)
            console.log('Error Handled: ' + logErr);
        if (res)
            res.status(500).send(resText);
    },
    returnError_noId: function (res) {
        this.returnError("Missing required _id parameter.", res);
    }
};

module.exports = errorHelpers;