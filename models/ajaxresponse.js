var _ = require('underscore');

var AjaxResponse = function (response) {
    this.response = response ? response : {};
};

AjaxResponse.prototype = {
    addDataKeyPair: function (key, value) {
        if (key && key.length > 0 && value)
            this.addDataObject({key: value});
    },
    addDataObject: function (obj) {
        if (obj)
            this.response = _.extend(this.response, obj);
    },
    getResponse: function () {
        return JSON.stringify(this.response);
    }
};

module.exports = AjaxResponse;