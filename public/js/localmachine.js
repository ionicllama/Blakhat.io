//MODELS
BH.models.LocalMachine = BH.models.Machine.extend({
    renderMachine: function () {
        new BH.views.LocalMachine({
            model: this,
            el: this.get('el')
        });
    },
    createIPRefreshCountdown: function ($el) {
        BH.helpers.viewHelpers.createCountdownTimer($el, BH.sharedHelpers.getNewDateAddHours(this.get('machine').lastIPRefresh, 24));
    },
    canRefreshIP: function () {
        return BH.sharedHelpers.checkDateIsBeforeToday(BH.sharedHelpers.getNewDateAddDays(this.get('machine').lastIPRefresh, 1));
    },
    createPasswordResetCountdown: function ($el) {
        BH.helpers.viewHelpers.createCountdownTimer($el, BH.sharedHelpers.getNewDateAddHours(this.get('machine').lastPasswordReset, 4));
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
        this.model.createPasswordResetCountdown(this.$('.password-reset-countdown'));
        this.model.createIPRefreshCountdown(this.$('.ip-refresh-countdown'));
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
    initCPUUpgradeModal: function () {
        new BH.views.MachineUpgradeModal({
            model: this.model,
            template: '/views/partials/machine/modal_upgradecpu.ejs',
            initTableColSort: 2,
            upgradeCallback: this.model.upgradeCPU.bind(this.model)
        });
    },
    initHDDUpgradeModal: function () {
        new BH.views.MachineUpgradeModal({
            model: this.model,
            template: '/views/partials/machine/modal_upgradehdd.ejs',
            initTableColSort: 1,
            upgradeCallback: this.model.upgradeHDD.bind(this.model)
        });
    },
    initInternetUpgradeModal: function () {
        new BH.views.MachineUpgradeModal({
            model: this.model,
            template: '/views/partials/machine/modal_upgradeinternet.ejs',
            initTableColSort: 2,
            upgradeCallback: this.model.upgradeInternet.bind(this.model)
        });
    }
});

BH.views.MachineUpgradeModal = BH.views.BaseView.extend({
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
    beforeFirstRender: function () {
        this.renderData = {
            model: this.model,
            machineParts: BH.data.machineParts
        };
        this.listenTo(this.model, "change", this.render);
        //force element to null in case one was passed in
        //this view uses modals only so it creates its own container to insert into in the <body>
        this.setElement(null);
        this.createModal();
    },
    createModal: function () {
        this.createModalContainer();
        var modal = $('<div class="modal fade" role="dialog">');
        this.modalContainer.append(modal);
        this.setElement(modal);
        this.$el.modal('show');
    },
    createModalContainer: function () {
        this.modalContainer = $('#modalsContainer');
        if (this.modalContainer.length == 0) {
            this.modalContainer = jQuery('<div id="modalsContainer" />');
            $('body').append(this.modalContainer);
        }
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

$(function () {
    new BH.models.LocalMachine({
        el: $('#pageOuterContainer')
    });
});