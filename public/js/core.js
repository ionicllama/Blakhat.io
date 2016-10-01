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
            var data = {};
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
    },
    renderMachineInfo: function () {
        new BH.views.MachineInfo({
            model: this.model,
            el: this.$('#machineInfo')
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


//Base Utils
BH.helpers = BH.helpers ? BH.helpers : {};
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
        "timeOut": "5000",
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
        if (response.responseJSON.data.error)
            this.showErrorToast(response.responseJSON.data.error, options);
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