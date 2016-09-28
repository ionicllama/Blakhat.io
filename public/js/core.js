var NH = NH ? NH : {};


//Constants
NH.constants = {};
NH.constants.dataTypes = {
    JSON: "json"
};


//Base Models
NH.models = NH.models ? NH.models : {};
NH.models.Machine = Backbone.Model.extend({
    url: '/machine',
    idAttribute: "_id",
    getCPUName: function () {
        return NH.sharedHelpers.cpuHelpers.getCPUName(this.get('cpu'));
    },
    getInternetName: function () {
        return NH.sharedHelpers.internetHelpers.getInternetName(this.get('internet'));
    },
    getFirewallName: function () {
        return NH.sharedHelpers.firewallHelpers.getFirewallName(this.get('firewall'));
    },
    refreshIP: function () {
        this.save(
            {
                ip: this.get('ip')
            },
            {
                patch: true,
                success: function (model, response) {
                    NH.helpers.Toastr.showSuccessToast("IP Address Refreshed", null);
                },
                error: function (model, err) {
                    NH.helpers.Toastr.showErrorToast(err, null);
                },
                wait: true
            }
        );
    },
    upgradeCPU: function (id) {
        this.save(
            {
                cpu: {
                    _id: id
                }
            },
            {
                patch: true,
                success: function (data) {
                    NH.helpers.Toastr.showSuccessToast("CPU Upgraded", null);
                },
                error: function (model, response) {
                    NH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    },
    upgradeHDD: function (id) {
        this.save(
            {
                hdd: {
                    _id: id
                }
            },
            {
                patch: true,
                success: function (data) {
                    NH.helpers.Toastr.showSuccessToast("HDD Upgraded", null);
                },
                error: function (model, response) {
                    NH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    },
    upgradeInternet: function (id) {
        this.save(
            {
                internet: {
                    _id: id
                }
            },
            {
                patch: true,
                success: function (data) {
                    NH.helpers.Toastr.showSuccessToast("Internet Upgraded", null);
                },
                error: function (model, response) {
                    NH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    }
});


//Base Views
NH.views = NH.views ? NH.views : {};
//Core view used for global view functions
NH.views.View = Backbone.View.extend({
    renderTemplate: function (data) {
        if (this.options.template && this.$el)
            NH.helpers.viewHelpers.renderTemplate(this.options.template, this.$el, data);
    }
});

NH.views.MachineInfo = NH.views.View.extend({
    initialize: function () {
        this.listenTo(this.model, "change", this.render);


        //move to render once rendering template on client side
        this.$el.find('#ipRefreshButton').on('click', $.proxy(function (e) {
            this.model.refreshIP();
        }, this));

        this.$el.find('#cpuUpgradeButton').on('click', $.proxy(function (e) {
            new NH.views.MachineUpgradeModal({
                el: '#cpuUpgradeRender',
                model: this.model,
                template: '/views/partials/machine/modal_upgradecpu.ejs',
                initTableColSort: 2,
                upgradeCallback: this.model.upgradeCPU.bind(this.model)
            });
        }, this));

        this.$el.find('#hddUpgradeButton').on('click', $.proxy(function (e) {
            new NH.views.MachineUpgradeModal({
                el: '#hddUpgradeRender',
                model: this.model,
                template: '/views/partials/machine/modal_upgradehdd.ejs',
                initTableColSort: 1,
                upgradeCallback: this.model.upgradeHDD.bind(this.model)
            });
        }, this));

        this.$el.find('#internetUpgradeButton').on('click', $.proxy(function (e) {
            new NH.views.MachineUpgradeModal({
                el: '#internetUpgradeRender',
                model: this.model,
                template: '/views/partials/machine/modal_upgradeinternet.ejs',
                initTableColSort: 2,
                upgradeCallback: this.model.upgradeInternet.bind(this.model)
            });
        }, this));
    },
    render: function () {
        this.$el.find('#machineIP').text(this.model.get('ip'));
        var nextRefresh = NH.sharedHelpers.getNewDateAddDays(new Date(this.model.get('lastIPRefresh')), 1);
        if (NH.sharedHelpers.checkDateIsBeforeToday(nextRefresh)) {
            this.$el.find('#ipRefreshDate').hide();
            this.$el.find('#ipRefreshButton').show();
        }
        else {
            this.$el.find('#ipRefreshButton').hide();
            this.$el.find('#ipRefreshDate').text(NH.sharedHelpers.getDateDiffString(nextRefresh));
            this.$el.find('#ipRefreshDate').show();
        }

        this.$el.find('#machineCPU').text(this.model.getCPUName());
        this.$el.find('#machineInternet').text(this.model.getInternetName());
        this.$el.find('#machineFirewall').text(NH.sharedHelpers.firewallHelpers.getFirewallName(this.model.get('firewall')));
    }
});

NH.views.MachineUpgradeModal = NH.views.View.extend({
    defaults: {
        initTableColSort: 0
    },
    initialize: function (options) {
        this.options = _.defaults(options, this.defaults);

        if (!this.options.template || !this.model || !this.options.upgradeCallback) {
            NH.helpers.Toastr.showErrorToast("Failed to load view");
            return;
        }

        this.listenTo(this.model, "change", this.render);

        this.render();
    },
    render: function () {
        this.renderTemplate(
            {
                machine: this.model.attributes,
                machineParts: NH.data.machineParts
            }
        );

        this.$dataTable = this.$el.find('.data-table');
        if (this.$dataTable) {
            this.$dataTable.dataTable({
                colReorder: {
                    order: [this.options.initTableColSort]
                }
            });
            this.$dataTable.on('draw.dt', $.proxy(function () {
                this.addDataTableEvents();
            }, this));
            this.addDataTableEvents();
        }
    },
    addDataTableEvents: function () {
        this.$el.find('.buyButton').on('click', $.proxy(function (e) {
            var id = $(e.target).attr('_id');
            this.options.upgradeCallback(id);
        }, this));
    }
});

NH.views.UpgradeHDD = NH.views.View.extend({
    initialize: function () {
        this.listenTo(this.model, "change", this.render);

        this.$dataTable = this.$el.find('.data-table');
        this.$dataTable.dataTable({
            colReorder: {
                order: [1]
            }
        });
        this.$dataTable.on('draw.dt', $.proxy(function () {
            this.render();
        }, this));
        this.addDataTableEvents();
    },
    render: function () {
        this.$el.find('.buyButton').each($.proxy(function (i, el) {
            var t = $(el);
            if (t.attr('_id') === this.model.get('hdd')._id) {
                t.prop('disabled', true);
            }
            else {
                t.prop('disabled', false);
            }
        }, this));

        this.addDataTableEvents();
    },
    addDataTableEvents: function () {
        this.$el.find('.buyButton').on('click', $.proxy(function (e) {
            var hddId = $(e.target).attr('_id');
            this.model.upgradeHDD(hddId);
        }, this));
    }
});

NH.views.UpgradeInternet = Backbone.View.extend({
    initialize: function () {
        this.listenTo(this.model, "change", this.render);

        this.$dataTable = this.$el.find('.data-table');
        this.$dataTable.dataTable({
            colReorder: {
                order: [1]
            }
        });
        this.$dataTable.on('draw.dt', $.proxy(function () {
            this.render();
        }, this));
        this.addDataTableEvents();
    },
    render: function () {
        this.$el.find('.buyButton').each($.proxy(function (i, el) {
            var t = $(el);
            if (t.attr('_id') === this.model.get('hdd')._id) {
                t.prop('disabled', true);
            }
            else {
                t.prop('disabled', false);
            }
        }, this));

        this.addDataTableEvents();
    },
    addDataTableEvents: function () {
        this.$el.find('.buyButton').on('click', $.proxy(function (e) {
            var hddId = $(e.target).attr('_id');
            this.model.upgradeInternet(hddId);
        }, this));
    }
});


//Base Utils
NH.helpers = NH.helpers ? NH.helpers : {};
NH.helpers.Toastr = {
    defaultOptions: {
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
        toastr.options = this.defaultOptions;
        toastr.success(message);
    },
    showErrorToast: function (message, options) {
        toastr.options = this.defaultOptions;
        toastr.error(message);
    },
    showBBResponseErrorToast: function (response, options) {
        if (response.responseJSON.data.error)
            this.showErrorToast(response.responseJSON.data.error, options);
    }
};

NH.helpers.viewHelpers = {
    renderTemplate: function (url, $el, data) {
        $.ajax({
            url: url,
            method: 'GET',
            async: false,
            dataType: 'html',
            success: function (html) {
                var tmpl = _.template(html);
                $el.html(tmpl(data));
            }
        });
    },
    enableBSButton: function (obj, enable) {
        if (obj) {
            if (enable)
                obj.prop('disabled', false);
            else
                obj.prop('disabled', false);
        }
    }
};