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

BH.models.Machine = BH.models.BaseModel.extend({
    urlRoot: '/machine',
    initialize: function () {
        this.on('sync', this.renderMachine, this);
        this.fetchMachine();
    },
    fetchMachine: function () {
        if (this.get('password')) {
            var fetchParams = {
                data: $.param({password: this.get('password')})
            };
            this.fetch(fetchParams);
        }
        else {
            this.fetch();
        }
    },
    renderMachine: function () {
        new BH.views.Machine({
            model: this,
            el: this.get('el')
        });
    },
    parse: function (response) {
        if (response.machine)
            response._id = response.machine._id;
        return response;
    },
    getPatchData: function (extraData) {
        var data = {};
        if (this.get('sourceIP'))
            data.sourceIP = this.get('sourceIP');
        if (this.get('password'))
            data.password = this.get('password');

        return _.extend(data, extraData);
    },
    updateLog: function (logText) {
        var data = this.getPatchData({
            log: logText
        });
        this.save(data, {
                patch: true,
                success: function (data) {
                    BH.helpers.Toastr.showSuccessToast("Log update successful", null);
                },
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    },
    getCPUName: function () {
        return BH.sharedHelpers.cpuHelpers.getCPUName(this.get('machine').cpu);
    },
    getHDDName: function () {
        return BH.sharedHelpers.hddHelpers.getHDDName(this.get('machine').hdd);
    },
    getInternetName: function () {
        return BH.sharedHelpers.internetHelpers.getInternetName(this.get('machine').internet);
    },
    getFirewallName: function () {
        return BH.sharedHelpers.firewallHelpers.getFirewallName(this.get('machine').firewall);
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
    }
});

BH.views.Machine = BH.views.BaseView.extend({
    defaults: {
        template: '/views/partials/machine/machine.ejs'
    },
    afterRender: function () {
        this.renderMachineInfo();
        this.renderMachineLog();
    },
    renderMachineInfo: function () {
        new BH.views.MachineInfo({
            model: this.model,
            el: this.$('#machineInfo')
        });
    },
    renderMachineLog: function () {
        new BH.views.MachineLog({
            model: this.model,
            el: this.$('#machineLog')
        });
    }
});

BH.views.MachineInfo = BH.views.BaseView.extend({
    defaults: {
        template: '/views/partials/machine/machineinfo.ejs'
    },
    beforeFirstRender: function (options) {
        this.renderData = {
            model: this.model
        };
    }
});

BH.views.MachineLog = BH.views.BaseView.extend({
    defaults: {
        template: '/views/partials/machine/machinelog.ejs'
    },
    events: {
        'keyup .log-text': 'logChanged',
        'change .log-text': 'logChanged',
        'click .log-save-button': 'saveLog'
    },
    beforeFirstRender: function (options) {
        this.renderData = {
            model: this.model
        };
        this.listenTo(this.model, "change:log", this.render);
    },
    logChanged: function () {
        if (this.$('.log-text').val().length > 0 || this.model.get('machine').log.length > 0)
            this.$('.log-save-button').prop('disabled', false);
        else
            this.$('.log-save-button').prop('disabled', true);
    },
    saveLog: function () {
        this.model.updateLog(this.$('.log-text').val());
    }
});

//Base Utils
BH.helpers = BH.helpers ? BH.helpers : {};
BH.helpers.viewHelpers = {
    createCountdownTimer: function ($el, date) {
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