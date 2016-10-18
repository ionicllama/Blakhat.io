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
    parse: function (response) {
        if (response.machine)
            response._id = response.machine._id;
        return response;
    },
    getPatchData: function (extraData) {
        var data = {};
        if (this.get('sourceMachine'))
            data.sourceMachine = this.get('sourceMachine')._id;
        if (this.get('password'))
            data.password = this.get('password');

        return _.extend(data, extraData);
    },
    updateLog: function (logText) {
        new BH.models.Process({
            type: BH.sharedHelpers.processHelpers.types.UPDATE_LOG,
            processMachine_id: BH.app.localMachine.get('machine')._id,
            machine_id: this.get('_id'),
            log: logText
        }).save(this.getPatchData(), {
            patch: true,
            success: $.proxy(function (data) {
                BH.helpers.Toastr.showSuccessToast("Process started: Update Log", null);

                if (BH.app.localMachineProcesses)
                    BH.app.localMachineProcesses.fetch();
            }, this),
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

BH.models.RemoteMachine = BH.models.Machine.extend({
    renderMachine: function () {
        new BH.views.RemoteMachine({
            model: this,
            el: this.get('el')
        });
    }
});

BH.models.LocalMachine = BH.models.Machine.extend({
    renderMachine: function () {
        if (this.get('el'))
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
    upgradeCPU: function (purchaseAccount, options) {
        this.save(
            {
                purchaseAccount: purchaseAccount.get('account'),
                cpu: {
                    _id: options.upgradeId
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
    upgradeHDD: function (purchaseAccount, options) {
        this.save(
            {
                purchaseAccount: purchaseAccount.get('account'),
                hdd: {
                    _id: options.upgradeId
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
    upgradeInternet: function (purchaseAccount, options) {
        this.save(
            {
                purchaseAccount: purchaseAccount.get('account'),
                internet: {
                    _id: options.upgradeId
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

BH.models.CPU = BH.models.BaseModel.extend({
    urlRoot: '/CPU',
    initialize: function () {
        //this.on('sync', this.renderMachine, this);
        //this.fetch();
    }
});

BH.models.HDD = BH.models.BaseModel.extend({
    urlRoot: '/HDD',
    initialize: function () {
        //this.on('sync', this.renderMachine, this);
        //this.fetch();
    }
});

BH.models.Internet = BH.models.BaseModel.extend({
    urlRoot: '/Internet',
    initialize: function () {
        //this.on('sync', this.renderMachine, this);
        //this.fetch();
    }
});


//COLLECTIONS
BH.collections.CPUS = BH.collections.BaseCollection.extend({
    model: BH.models.CPU,
    url: '/machineParts/cpus',
    afterInit: function () {
        this.on('sync', this.renderCPU, this);
        this.fetch();
    },
    renderCPU: function () {
        new BH.views.MachineUpgradeModal({
            model: this.options.machine,
            renderData: {
                model: this.options.machine,
                cpus: this
            },
            template: '/views/partials/machine/modal_upgradecpu.ejs',
            initTableColSort: 2,
            upgradeCallback: this.options.machine.upgradeCPU.bind(this.options.machine)
        });
    }
});

BH.collections.HDDS = BH.collections.BaseCollection.extend({
    model: BH.models.HDD,
    url: '/machineParts/hdds',
    afterInit: function () {
        this.on('sync', this.renderHDD, this);
        this.fetch();
    },
    renderHDD: function () {
        new BH.views.MachineUpgradeModal({
            model: this.options.machine,
            renderData: {
                model: this.options.machine,
                hdds: this
            },
            template: '/views/partials/machine/modal_upgradehdd.ejs',
            initTableColSort: 1,
            upgradeCallback: this.options.machine.upgradeHDD.bind(this.options.machine)
        });
    }
});

BH.collections.Internets = BH.collections.BaseCollection.extend({
    model: BH.models.Internet,
    url: '/machineParts/internets',
    afterInit: function () {
        this.on('sync', this.renderInternets, this);
        this.fetch();
    },
    renderInternets: function () {
        new BH.views.MachineUpgradeModal({
            model: this.options.machine,
            renderData: {
                model: this.options.machine,
                internets: this
            },
            template: '/views/partials/machine/modal_upgradeinternet.ejs',
            initTableColSort: 2,
            upgradeCallback: this.options.machine.upgradeInternet.bind(this.options.machine)
        });
    }
});


//VIEWS
BH.views.Machine = BH.views.BaseView.extend({
    defaults: {
        template: '/views/partials/machine/machine.ejs',
        canDownloadFiles: true
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
    },
    renderFiles: function () {
        new BH.collections.Files(this.model.get('machine').files,
            {
                machine: this.model.get('machine'),
                el: this.$('#files'),
                canDownloadFiles: this.options.canDownloadFiles ? this.options.canDownloadFiles : false
            });
    }
});

BH.views.LocalMachine = BH.views.Machine.extend({
    defaults: {
        template: '/views/partials/machine/machine.ejs',
        canDownloadFiles: false
    },
    afterRender: function () {
        this.renderMachineInfo();
        this.renderMachineLog();
        this.renderProcesses();
        this.renderFiles();
    },
    renderMachineInfo: function () {
        new BH.views.LocalMachineInfo({
            model: this.model,
            el: this.$('#machineInfo')
        });
    },
    renderProcesses: function () {
        BH.app.localMachineProcesses = new BH.collections.Processes(this.model.get('machine').processes,
            {
                machine: this.model.get('machine'),
                el: this.$('#processes')
            });
    }
});

BH.views.RemoteMachine = BH.views.Machine.extend({
    afterRender: function () {
        this.renderMachineInfo();
        this.renderMachineLog();
        this.renderFiles();
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
        this.listenTo(this.model, "change:ip change:password change:cpu change:hdd change:internet", this.render);
    }
});

BH.views.LocalMachineInfo = BH.views.MachineInfo.extend({
    events: {
        'click #ipRefreshButton': 'refreshIPConfirm',
        'click #toggleMachinePassword': 'toggleMachinePassword',
        'click #passwordResetButton': 'resetPasswordConfirm',
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
    refreshIPConfirm: function () {
        new BH.views.ConfirmModal({
            header: "Confirm IP Refresh",
            body: "Are you sure you want to refresh your IP address?  You can only do this once a day.",
            onConfirm: this.refreshIP.bind(this)
        });
    },
    refreshIP: function () {
        this.model.refreshIP();
    },
    resetPasswordConfirm: function () {
        new BH.views.ConfirmModal({
            header: "Confirm Password Reset",
            body: "Are you sure you want to reset your password?  You can only do this every 4 hours.",
            onConfirm: this.resetPassword.bind(this)
        });
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
    initCPUUpgradeModal: function () {
        new BH.collections.CPUS([], {
            machine: this.model
        });
    },
    initHDDUpgradeModal: function () {
        new BH.collections.HDDS([], {
            machine: this.model
        });
    },
    initInternetUpgradeModal: function () {
        new BH.collections.Internets([], {
            machine: this.model
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
        'page.dt .data-table': 'pageNumberChanged',
        'length.dt .data-table': 'pageLengthChanged',
        'click .buyButton': 'buyUpgrade',
        'hidden.bs.modal': 'remove'
    },
    afterRender: function () {
        if (this.$('.data-table')) {
            this.upgradeTable = this.$('.data-table').DataTable({
                displayStart: this.options.dataTablePage * this.options.dataTableLength,
                language: {
                    emptyTable: "No upgrades available",
                    "info": "Showing _START_ to _END_ of _TOTAL_ upgrades",
                    "infoEmpty": "Showing 0 to 0 of 0 upgrades",
                    "infoFiltered": " - filtered from _MAX_ upgrades"
                },
                pageLength: this.options.dataTableLength,
                order: [this.options.initTableColSort, 'asc'],
                columnDefs: [
                    {orderable: false, targets: -1}
                ]
            });
        }
    },
    buyUpgrade: function (e) {
        var id = $(e.target).attr('_id'),
            amount = $(e.target).attr('amount');
        new BH.collections.UserBankAccountSelect([], {
            amount: amount,
            upgradeId: id,
            callback: this.options.upgradeCallback.bind(this)
        });
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