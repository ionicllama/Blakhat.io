var BH = BH ? BH : {};

//CONSTANTS
BH.constants = {};
BH.constants.dataTypes = {
    JSON: "json"
};


//MODELS
BH.models = BH.models ? BH.models : {};

BH.models.BaseModel = Backbone.Model.extend({
    idAttribute: "_id",
    setSilent: function (attrs) {
        for (var i in attrs) {
            this.attributes[i] = attrs[i];
        }
    }
});

//VIEWS
BH.views = BH.views ? BH.views : {};

BH.views.BaseView = Backbone.View.extend({
    initialize: function (options) {
        this.options = _.defaults(options ? options : {}, this.defaults);
        if (this.beforeFirstRender() != false)
            this.render();
    },
    beforeFirstRender: function () {
        return true;
    },
    beforeRender: function () {
        return true;
    },
    render: function () {
        if (this.beforeRender() != false && this.options.template && this.$el)
            BH.helpers.TemplateRenderer.renderTemplate(this.options.template, this.$el, this.renderData ? this.renderData : {}, this.afterRender.bind(this));
        return this;
    },
    afterRender: function () {
        //overridden in extended classes
    },
    inputClickSelectAll: function (e) {
        if (e.target)
            $(e.target).select();
    }
});


//Base Utils
BH.helpers = BH.helpers ? BH.helpers : {};
BH.helpers.viewHelpers = {
    createCountdownTimer: function ($el, date, finishCallback) {
        if ($el) {
            var t = BH.sharedHelpers.getTimeRemaining(date);
            this.createCountdownElement(t, $el);
            var interval = setInterval(_.bind(function () {
                t = BH.sharedHelpers.getTimeRemaining(date);

                if (t.total > 0) {
                    this.createCountdownElement(t, $el);
                }
                else {
                    clearInterval(interval);
                }
            }, this), 1000);

        }
        return interval;
    },
    createCountdownElement: function (remaining, $el) {
        var s = "";
        if (remaining.days > 0)
            s += (remaining.days + "d ");
        if (remaining.hours > 0 || remaining.days > 0)
            s += (remaining.hours + "h ");
        if (remaining.minutes > 0 || remaining.hours > 0 || remaining.days > 0)
            s += (remaining.minutes + "m ");
        if (remaining.seconds > 0 || remaining.minutes > 0 || remaining.hours > 0 || remaining.days > 0)
            s += (remaining.seconds + "s ");

        $el.html(s);
    }
};
BH.helpers.Toastr = {
    defaults: {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-bottom-right",
        "preventDuplicates": true,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "3000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    },
    showSuccessToast: function (message, options) {
        toastr.options = this.options = _.defaults(options ? options : {}, this.defaults);
        toastr.success(message);
    },
    showErrorToast: function (message, options) {
        toastr.options = this.options = _.defaults(options ? options : {}, this.defaults);
        toastr.error(message);
    },
    showBBResponseErrorToast: function (response, options) {
        if (response.responseText)
            this.showErrorToast(response.responseText, options);
    }
};

BH.helpers.TemplateRenderer = {
    templates: {},
    renderTemplate: function (url, $el, data, callback) {
        var tmpl = this.templates[url];
        if (tmpl) {
            this.render(tmpl, $el, data, callback);
        }
        else {
            $.ajax({
                url: url,
                method: 'GET',
                async: false,
                dataType: 'html',
                success: $.proxy(function (html) {
                    tmpl = _.template(html);
                    this.templates[url] = tmpl;
                    this.render(tmpl, $el, data, callback);
                }, this)
            });
        }
    },
    render: function (tmpl, $el, data, callback) {
        $el.html(tmpl(data ? data : {}));
        callback();
    }
};