//MODELS
BH.models.Bot = BH.models.BaseModel.extend({
    urlRoot: '/bot',
    initialize: function () {
        this.on('sync', this.renderBot, this);
        this.set('profitPerTick', BH.sharedHelpers.botHelpers.calculateProfitPerTick(this.attributes));
    },
    startJob: function (job) {
        var self = this;
        this.save(
            {
                job: job
            },
            {
                patch: true,
                success: function (model, response) {
                    BH.helpers.Toastr.showSuccessToast("Job started on bot: " + self.get('machine').ip, null);
                },
                error: function (model, err) {
                    BH.helpers.Toastr.showBBResponseErrorToast(err, null);
                },
                wait: true
            }
        );
    },
    stopJob: function (job) {
        var self = this;
        this.save(
            {
                job: -1
            },
            {
                patch: true,
                success: function (model, response) {
                    BH.helpers.Toastr.showSuccessToast("Job stopped on bot: " + self.get('machine').ip, null);
                },
                error: function (model, err) {
                    BH.helpers.Toastr.showBBResponseErrorToast(err, null);
                },
                wait: true
            }
        );
    },
    collectProfit: function (bankAccount) {
        var self = this;
        this.save(
            {
                bankAccount: bankAccount.get('_id')
            },
            {
                patch: true,
                success: function (model, response) {
                    BH.helpers.Toastr.showSuccessToast("Profit collected from bot: " + self.get('machine').ip, null);
                },
                error: function (model, err) {
                    BH.helpers.Toastr.showBBResponseErrorToast(err, null);
                },
                wait: true
            }
        );
    }
});


//COLLECTIONS
BH.collections.Botnet = BH.collections.BaseCollection.extend({
    model: BH.models.Bot,
    url: '/bot',
    afterInit: function () {
        this.on('sync', this.renderBotnet, this);
        this.fetch();
    },
    renderBotnet: function () {
        new BH.views.Botnet({
            el: this.options.el,
            collection: this
        });
    }
});


//VIEWS
BH.views.Bot = BH.views.BaseCollectionChildView.extend({
    defaults: {
        template: '/views/partials/botnet/bot.ejs',
        isAppend: true
    },
    events: {
        'click .bot-login': 'login',
        'click .bot-start-job': 'startJob',
        'click .bot-stop-job': 'stopJob',
        'click .bot-collect-profit': 'collectProfit',
        'click .bot-remove': 'removeBotConfirm'
    },
    beforeFirstRender: function (options) {
        this.$parentEl = this.$el
    },
    beforeRender: function () {
        this.renderData = {
            model: this.model,
            fileStats: BH.sharedHelpers.fileHelpers.getFileStats(this.model.get('machine').files),
            timeElapsed: this.model.get('jobStartedOn') ? BH.sharedHelpers.getTimeRemaining(new Date(this.model.get('jobStartedOn'))) : null
        };
    },
    reRender: function () {
        this.remove();
        this.$el = this.$parentEl;
        this.render();
    },
    afterRender: function () {
        if (this.model.get('jobStartedOn')) {
            BH.helpers.viewHelpers.createElapsedTimer($('.bot-job-time-elapsed'), new Date(this.model.get('jobStartedOn')));
            this.createProfitCounter();
        }
    },
    createProfitCounter: function () {
        var $el = $('.bot-job-profit');
        if ($el) {
            BH.sharedHelpers.botHelpers.getProfit(this.model.attributes)
            $el.html(BH.sharedHelpers.formatCurrency(BH.sharedHelpers.botHelpers.getProfit(this.model.attributes)));
            var interval = setInterval(_.bind(function () {
                $el.html(BH.sharedHelpers.formatCurrency(BH.sharedHelpers.botHelpers.getProfit(this.model.attributes)));
            }, this), 5000);
        }
        return interval;
    },
    login: function () {
        var url = "#internet/ip" + this.model.get('machine').ip + '_admin';
        BH.app.router.navigate(url, {trigger: true});
    },
    startJob: function (e) {
        this.model.startJob(parseInt($(e.currentTarget).attr('job')));
    },
    stopJob: function (e) {
        this.model.stopJob();
    },
    collectProfit: function () {
        new BH.collections.UserBankAccountSelect([], {
            callback: this.model.collectProfit.bind(this.model)
        });
    },
    removeBotConfirm: function () {
        new BH.views.DeleteModal({
            header: "Remove Process",
            body: "Are you sure you want to cancel and remove this bot?  You will no longer be automatically logged in when viewing it on the internet.",
            extras: {
                buttonText: "Remove"
            },
            onConfirm: this.removeBot.bind(this)
        });
    },
    removeBot: function () {
        if (this.elapsedInterval)
            clearInterval(this.elapsedInterval);
        this.model.destroy({
            success: $.proxy(function (model, response) {
                this.collection.fetch();
            }, this),
            error: $.proxy(function (model, response) {
                BH.helpers.Toastr.showBBResponseErrorToast(response, null);
            }, this)
        });
    }
});

BH.views.Botnet = BH.views.BaseCollectionView.extend({
    defaults: {
        template: '/views/partials/botnet/botnet_manage.ejs',
        dataTablePage: 0,
        dataTableLength: 10,
        initTableColSort: 0,
        childView: BH.views.Bot
    },
    events: {
        'page.dt .data-table': 'pageNumberChanged',
        'length.dt .data-table': 'pageLengthChanged',
        'change .processes-auto-finish': 'executeCompleteProcesses'
    },
    beforeFirstRender: function (options) {
        this.renderData = {
            model: this.model
        };
    },
    beforeChildrenRender: function (options) {
        this.childEl = this.$('#botList');
    },
    afterChildrenRender: function () {
        if (this.$('.data-table')) {
            this.$('.data-table').DataTable({
                displayStart: this.options.dataTablePage * this.options.dataTableLength,
                language: {
                    emptyTable: "No bots available",
                    "info": "Showing _START_ to _END_ of _TOTAL_ bots",
                    "infoEmpty": "Showing 0 to 0 of 0 bots",
                    "infoFiltered": " - filtered from _MAX_ bots"
                },
                pageLength: this.options.dataTableLength,
                order: [this.options.initTableColSort, 'asc'],
                columnDefs: [
                    {orderable: false, targets: -1}
                ],
                columns: [
                    {type: "ip-address"},
                    {type: "string"},
                    {type: "string"},
                    {type: "string"},
                    {type: "string"},
                    {type: "string"},
                    {type: "string"},
                    {type: "currency"},
                    null
                ]
            });
        }
    }
});