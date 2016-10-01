var BH = BH ? BH : {};

//MODELS
BH.models.LocalMachine = BH.models.Machine.extend({
    renderMachine: function () {
        new BH.views.LocalMachine({
            model: this,
            el: this.get('el')
        });
    },
    getNextIPRefreshDateString: function () {
        return BH.sharedHelpers.getDateDiffString(BH.sharedHelpers.getNewDateAddDays(this.get('lastIPRefresh'), 1));
    },
    canRefreshIP: function () {
        return BH.sharedHelpers.checkDateIsBeforeToday(BH.sharedHelpers.getNewDateAddDays(this.get('lastIPRefresh'), 1));
    },
    refreshIP: function () {
        this.save(
            {
                ip: this.get('ip')
            },
            {
                patch: true,
                success: function (model, response) {
                    BH.helpers.Toastr.showSuccessToast("IP Address Refreshed", null);
                },
                error: function (model, err) {
                    BH.helpers.Toastr.showErrorToast(err, null);
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
                    BH.helpers.Toastr.showSuccessToast("CPU Upgraded", null);
                },
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
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
                    BH.helpers.Toastr.showSuccessToast("HDD Upgraded", null);
                },
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
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
                    BH.helpers.Toastr.showSuccessToast("Internet Upgraded", null);
                },
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    }
});

//VIEWS
BH.views.LocalMachine = BH.views.Machine.extend({
    defaults: {
        template: '/views/partials/machine/machine.ejs'
    },
    renderMachineInfo: function () {
        new BH.views.LocalMachineInfo({
            model: this.model,
            el: this.$('#machineInfo')
        });
    }
});

BH.views.LocalMachineInfo = BH.views.MachineInfo.extend({
    events: {
        'click #ipRefreshButton': 'refreshIP',
        'click #cpuUpgradeButton': 'initCPUUpgradeModal',
        'click #hddUpgradeButton': 'initHDDUpgradeModal',
        'click #internetUpgradeButton': 'initInternetUpgradeModal'
    },
    beforeFirstRender: function () {
        this.renderData = {
            model: this.model
        };
    },
    refreshIP: function () {
        this.model.refreshIP();
    },
    initCPUUpgradeModal: function () {
        if (!this.cpuUpgradeModal) {
            this.cpuUpgradeModal = new BH.views.MachineUpgradeModal({
                el: '#cpuUpgradeRender',
                model: this.model,
                template: '/views/partials/machine/modal_upgradecpu.ejs',
                initTableColSort: 2,
                upgradeCallback: this.model.upgradeCPU.bind(this.model)
            });
        }
    },
    initHDDUpgradeModal: function () {
        if (!this.hddUpgradeModal) {
            this.hddUpgradeModal = new BH.views.MachineUpgradeModal({
                el: '#hddUpgradeRender',
                model: this.model,
                template: '/views/partials/machine/modal_upgradehdd.ejs',
                initTableColSort: 1,
                upgradeCallback: this.model.upgradeHDD.bind(this.model)
            });
        }
    },
    initInternetUpgradeModal: function () {
        if (!this.internetUpgradeModal) {
            this.internetUpgradeModal = new BH.views.MachineUpgradeModal({
                el: '#internetUpgradeRender',
                model: this.model,
                template: '/views/partials/machine/modal_upgradeinternet.ejs',
                initTableColSort: 2,
                upgradeCallback: this.model.upgradeInternet.bind(this.model)
            });
        }
    }
});

BH.views.MachineUpgradeModal = BH.views.BaseView.extend({
    defaults: {
        initTableColSort: 0
    },
    events: {
        'draw.dt .data-table': 'addDataTableEvents',
        'click .buyButton': 'buyUpgrade'
    },
    beforeFirstRender: function () {
        this.renderData = {
            model: this.model,
            machineParts: BH.data.machineParts
        };
        this.listenTo(this.model, "change", this.render);
    },
    afterRender: function () {
        if (this.$('.data-table')) {
            this.$('.data-table').dataTable({
                colReorder: {
                    order: [this.options.initTableColSort]
                }
            });
        }
    },
    buyUpgrade: function (e) {
        var id = $(e.target).attr('_id');
        this.options.upgradeCallback(id);
    }
});

$(function () {
    new BH.models.LocalMachine({
        el: $('#pageOuterContainer')
    });
});