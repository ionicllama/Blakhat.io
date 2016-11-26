//MODELS
BH.models.Bot = BH.models.BaseModel.extend({
    urlRoot: '/bot',
    initialize: function () {
        this.on('sync', this.renderBot, this);
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

BH.models.Botnet = BH.models.BaseModel.extend({
    urlRoot: '/botnet',
    initialize: function () {
        this.on('sync', this.renderBot, this);
        this.listenTo(this, "change:name", this.changeName);
    },
    changeName: function () {
        this.save(
            {
                name: this.get('name')
            },
            {
                patch: true,
                success: function (model, response) {
                    BH.helpers.Toastr.showSuccessToast("Botnet saved successfully");
                },
                error: function (model, err) {
                    BH.helpers.Toastr.showBBResponseErrorToast(err, null);
                },
                wait: true
            }
        );
    },
    addBots: function (newBots) {
        this.save(
            {
                newBots: newBots
            },
            {
                patch: true,
                success: function (model, response) {
                    BH.helpers.Toastr.showSuccessToast("Botnet saved successfully");
                },
                error: function (model, err) {
                    BH.helpers.Toastr.showBBResponseErrorToast(err, null);
                },
                wait: true
            }
        );
    },
    removeBot: function (bot) {
        this.save(
            {
                removeBot: bot
            },
            {
                patch: true,
                success: function (model, response) {
                    BH.helpers.Toastr.showSuccessToast("Botnet saved successfully");
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
BH.collections.Bots = BH.collections.BaseCollection.extend({
    model: BH.models.Bot,
    url: '/bot',
    afterInit: function () {
        this.on('sync', this.renderBots, this);
        this.fetch();
    },
    renderBots: function () {
        if (this.options.view) {
            var viewOptions = {
                collection: this
            };
            if (this.options.el)
                viewOptions.el = this.options.el;
            if (this.options.botnet) {
                viewOptions.botnet = this.options.botnet;

                var removeModels = [],
                    i;
                for (i = 0; i < this.models.length; i++) {
                    if (_.where(viewOptions.botnet.get('bots'), {_id: this.models[i].get('_id')}).length > 0)
                        removeModels.push(this.models[i]);
                }
                for (i = 0; i < removeModels.length; i++) {
                    this.remove(removeModels[i]);
                }
            }
            new this.options.view(viewOptions)
        }
    }
});

BH.collections.Botnets = BH.collections.BaseCollection.extend({
    model: BH.models.Botnet,
    url: '/botnet',
    afterInit: function () {
        this.on('sync', this.renderBots, this);
        this.fetch();
    },
    renderBots: function () {
        new BH.views.Botnets({
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
            BH.helpers.viewHelpers.createElapsedTimer(this.$('.bot-job-time-elapsed'), new Date(this.model.get('jobStartedOn')));
            this.createProfitCounter();
        }
    },
    createProfitCounter: function () {
        var $el = this.$('.bot-job-profit');
        if ($el) {
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
            header: "Remove Bot",
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

BH.views.Bots = BH.views.BaseCollectionView.extend({
    defaults: {
        template: '/views/partials/botnet/bots_manage.ejs',
        dataTablePage: 0,
        dataTableLength: 10,
        initTableColSort: 0,
        childView: BH.views.Bot
    },
    events: {
        'page.dt .data-table': 'pageNumberChanged',
        'length.dt .data-table': 'pageLengthChanged'
    },
    beforeFirstRender: function (options) {
        this.renderData = {
            collection: this.collection
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
                    {type: "number"},
                    {type: "string"},
                    {type: "currency"},
                    null
                ]
            });
        }
    }
});

BH.views.Botnet = BH.views.BaseCollectionChildView.extend({
    defaults: {
        template: '/views/partials/botnet/botnet.ejs',
        isAppend: true
    },
    events: {
        'click .botnet-manage': 'manageBotnet',
        'click .botnet-remove': 'removeBotnetConfirm'
    },
    beforeFirstRender: function (options) {
        this.$parentEl = this.$el
    },
    beforeRender: function () {
        this.renderData = {
            model: this.model,
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
            BH.helpers.viewHelpers.createElapsedTimer(this.$('.botnet-job-time-elapsed'), new Date(this.model.get('jobStartedOn')));
            this.createProfitCounter();
        }
    },
    createProfitCounter: function () {
        var $el = this.$('.botnet-job-profit');
        if ($el) {
            $el.html(BH.sharedHelpers.formatCurrency(BH.sharedHelpers.botnetHelpers.getProfit(this.model.get('bots'))));
            var interval = setInterval(_.bind(function () {
                $el.html(BH.sharedHelpers.formatCurrency(BH.sharedHelpers.botnetHelpers.getProfit(this.model.get('bots'))));
            }, this), 5000);
        }
        return interval;
    },
    manageBotnet: function () {
        new BH.views.BotnetManageModal({
            model: this.model
        });
    },
    removeBotnetConfirm: function () {
        new BH.views.DeleteModal({
            header: "Remove Botnet",
            body: "Are you sure you want to cancel and remove this botnet?",
            extras: {
                buttonText: "Remove"
            },
            onConfirm: this.removeBotnet.bind(this)
        });
    },
    removeBotnet: function () {
        // if (this.elapsedInterval)
        //     clearInterval(this.elapsedInterval);
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

BH.views.Botnets = BH.views.BaseCollectionView.extend({
    defaults: {
        template: '/views/partials/botnet/botnets_manage.ejs',
        dataTablePage: 0,
        dataTableLength: 10,
        initTableColSort: 0,
        childView: BH.views.Botnet
    },
    events: {
        'page.dt .data-table': 'pageNumberChanged',
        'length.dt .data-table': 'pageLengthChanged',
        'click .botnet-create': 'createBotnet'
    },
    beforeFirstRender: function (options) {
        this.renderData = {
            collection: this.collection
        };
    },
    beforeChildrenRender: function (options) {
        this.childEl = this.$('#botnetList');
    },
    afterChildrenRender: function () {
        if (this.$('.data-table')) {
            this.$('.data-table').DataTable({
                displayStart: this.options.dataTablePage * this.options.dataTableLength,
                language: {
                    emptyTable: "No botnets available",
                    "info": "Showing _START_ to _END_ of _TOTAL_ botnets",
                    "infoEmpty": "Showing 0 to 0 of 0 botnets",
                    "infoFiltered": " - filtered from _MAX_ botnets"
                },
                pageLength: this.options.dataTableLength,
                order: [this.options.initTableColSort, 'asc'],
                columnDefs: [
                    {orderable: false, targets: -1}
                ],
                columns: [
                    {type: "string"},
                    {type: "number"},
                    {type: "string"},
                    {type: "number"},
                    {type: "string"},
                    {type: "currency"},
                    null
                ]
            });
        }
    },
    createBotnet: function () {
        var newBotnet = new BH.models.Botnet({});
        newBotnet.save(null, {
                patch: true,
                success: $.proxy(function (data) {
                    BH.helpers.Toastr.showSuccessToast("Botnet created successfully", null);
                    this.collection.add(newBotnet);
                }, this),
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    }
});

BH.views.BotPickerModal = BH.views.BaseModal.extend({
    defaults: {
        template: '/views/partials/botnet/modal_botpicker.ejs',
        dataTablePage: 0,
        dataTableLength: 10,
        initTableColSort: 1
    },
    events: {
        'page.dt .data-table': 'pageNumberChanged',
        'length.dt .data-table': 'pageLengthChanged',
        'click .bot-picker-add': 'pickBots'
    },
    beforeModalCreated: function () {
        var botnetBots = this.options.botnet.get('bots');
        this.renderData.collection = this.collection;
    },
    afterRender: function () {
        if (this.$('.data-table')) {
            this.botsTable = this.$('.data-table').DataTable({
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
                ]
            });
        }
    },
    pickBots: function () {
        var newBots = [];
        this.$el.find('.pick-bot').each(function () {
            if ($(this).is(':checked'))
                newBots.push($(this).attr('bot_id'));
        });
        this.options.botnet.addBots(newBots);
    }
});

BH.views.BotnetManageModal = BH.views.BaseModal.extend({
    defaults: {
        template: '/views/partials/botnet/modal_botnetmanage.ejs',
        dataTablePage: 0,
        dataTableLength: 10,
        initTableColSort: 0
    },
    events: {
        'page.dt .data-table': 'pageNumberChanged',
        'length.dt .data-table': 'pageLengthChanged',
        'keyup #botnet-name-input': 'botNameChanged',
        'click .botnet-bots-add': 'addBots',
        'click .botnet-bot-remove': 'removeBot'
    },
    beforeModalCreated: function () {
        this.model.on('sync', this.reRender, this);
        this.renderData.bots = this.model.get('bots');
    },
    reRender: function () {
        this.renderData.bots = this.model.get('bots');
        this.render();
    },
    afterRender: function () {
        this.$('.botnet-name').html(this.model.get('name'));
        this.$('#botnet-name-input').val(this.model.get('name'));
        if (this.$('.data-table')) {
            this.botsTable = this.$('.data-table').DataTable({
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
                ]
            });
        }

    },
    botNameChanged: function () {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
        this.saveTimeout = setTimeout($.proxy(function () {
            this.model.set('name', this.$('#botnet-name-input').val());
        }, this), 2000);
    },
    addBots: function () {
        new BH.collections.Bots([],
            {
                view: BH.views.BotPickerModal,
                botnet: this.model
            });
    },
    removeBot: function (e) {
        var selBotId = $(e.currentTarget).closest('.botnet-bot-container').attr('bot_id');
        this.model.removeBot(_.findWhere(this.model.get('bots')), {_id: selBotId});
    }
});