//MODELS
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

BH.models.RemoteMachine = BH.models.Machine.extend({});

BH.models.LocalMachine = BH.models.Machine.extend({
    renderMachine: function () {
        new BH.views.LocalMachine({
            model: this,
            el: this.get('el')
        });
    },
    canRefreshIP: function () {
        return BH.sharedHelpers.checkDateIsBeforeToday(BH.sharedHelpers.getNewDateAddDays(this.get('machine').lastIPRefresh, 1));
    },
    canResetPassword: function () {
        return BH.sharedHelpers.checkDateIsBeforeToday(BH.sharedHelpers.getNewDateAddHours(this.get('machine').lastPasswordReset, 4));
    },
    refreshIP: function () {
        this.save(
            {
                ip: this.get('machine').ip
            },
            {
                patch: true,
                success: function (model, response) {
                    BH.helpers.Toastr.showSuccessToast("IP Address Refresh Successful", null);
                },
                error: function (model, err) {
                    BH.helpers.Toastr.showBBResponseErrorToast(err, null);
                },
                wait: true
            }
        );
    },
    resetPassword: function () {
        this.save(
            {
                password: this.get('machine').password
            },
            {
                patch: true,
                success: function (model, response) {
                    BH.helpers.Toastr.showSuccessToast("Password Reset Successful", null);
                },
                error: function (model, err) {
                    BH.helpers.Toastr.showBBResponseErrorToast(err, null);
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
                    BH.helpers.Toastr.showSuccessToast("CPU Upgrade Successful", null);
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
                    BH.helpers.Toastr.showSuccessToast("HDD Upgrade Successful", null);
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
                    BH.helpers.Toastr.showSuccessToast("Internet Upgrade Successful", null);
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

BH.views.LocalMachineInfo = BH.views.MachineInfo.extend({
    events: {
        'click #ipRefreshButton': 'refreshIP',
        'click #toggleMachinePassword': 'toggleMachinePassword',
        'click #passwordResetButton': 'resetPassword',
        'click #cpuUpgradeButton': 'initCPUUpgradeModal',
        'click #hddUpgradeButton': 'initHDDUpgradeModal',
        'click #internetUpgradeButton': 'initInternetUpgradeModal'
    },
    beforeFirstRender: function () {
        this.renderData = {
            model: this.model
        };
    },
    afterRender: function () {
        this.createPasswordResetCountdown(this.$('.password-reset-countdown'));
        this.createIPRefreshCountdown(this.$('.ip-refresh-countdown'));
    },
    toggleMachinePassword: function () {
        if (!this.isPasswordVisible) {
            this.$('#machinePassword').text(this.model.get('machine').password);
            this.$('#toggleMachinePassword').text('Hide');
            this.isPasswordVisible = true;
        }
        else {
            this.$('#machinePassword').text("******");
            this.$('#toggleMachinePassword').text('Show');
            this.isPasswordVisible = false;
        }
    },
    refreshIP: function () {
        this.model.refreshIP();
    },
    resetPassword: function () {
        this.model.resetPassword();
    },
    createPasswordResetCountdown: function ($el) {
        BH.helpers.viewHelpers.createCountdownTimer($el, BH.sharedHelpers.getNewDateAddHours(this.model.get('machine').lastPasswordReset, 4), this.render.bind(this));
    },
    createIPRefreshCountdown: function ($el) {
        BH.helpers.viewHelpers.createCountdownTimer($el, BH.sharedHelpers.getNewDateAddHours(this.model.get('machine').lastIPRefresh, 24), this.render.bind(this));
    },
    getUpgradeModalRenderData: function () {
        return {
            model: this.model,
            machineParts: BH.data.machineParts
        };
    },
    initCPUUpgradeModal: function () {
        new BH.views.MachineUpgradeModal({
            model: this.model,
            template: '/views/partials/machine/modal_upgradecpu.ejs',
            initTableColSort: 2,
            upgradeCallback: this.model.upgradeCPU.bind(this.model),
            renderData: this.getUpgradeModalRenderData()
        });
    },
    initHDDUpgradeModal: function () {
        new BH.views.MachineUpgradeModal({
            model: this.model,
            template: '/views/partials/machine/modal_upgradehdd.ejs',
            initTableColSort: 1,
            upgradeCallback: this.model.upgradeHDD.bind(this.model),
            renderData: this.getUpgradeModalRenderData()
        });
    },
    initInternetUpgradeModal: function () {
        new BH.views.MachineUpgradeModal({
            model: this.model,
            template: '/views/partials/machine/modal_upgradeinternet.ejs',
            initTableColSort: 2,
            upgradeCallback: this.model.upgradeInternet.bind(this.model),
            renderData: this.getUpgradeModalRenderData()
        });
    }
});

BH.views.MachineUpgradeModal = BH.views.BaseModal.extend({
    defaults: {
        dataTablePage: 0,
        dataTableLength: 10,
        initTableColSort: 0
    },
    events: {
        'draw.dt .data-table': 'addDataTableEvents',
        'page.dt .data-table': 'pageNumberChanged',
        'length.dt .data-table': 'pageLengthChanged',
        'click .buyButton': 'buyUpgrade',
        'hidden.bs.modal': 'remove'
    },
    afterRender: function () {
        if (this.$('.data-table')) {
            this.upgradeTable = this.$('.data-table').DataTable({
                "displayStart": this.options.dataTablePage * this.options.dataTableLength,
                pageLength: this.options.dataTableLength,
                colReorder: {
                    order: [this.options.initTableColSort]
                }
            });
        }
    },
    pageNumberChanged: function () {
        if (this.upgradeTable.page)
            this.options.dataTablePage = this.upgradeTable.page.info().page;
    },
    pageLengthChanged: function (e, settings, len) {
        this.dataTableLength = len;
    },
    buyUpgrade: function (e) {
        var id = $(e.target).attr('_id');
        this.options.upgradeCallback(id);
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