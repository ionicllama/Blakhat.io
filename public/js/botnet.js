//MODELS
BH.models.Bot = BH.models.BaseModel.extend({
    urlRoot: '/bot',
    initialize: function () {
        this.on('sync', this.renderBotnet, this);
    },
    renderBot: function () {

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
BH.views.Bot = BH.views.BaseView.extend({
    defaults: {
        template: '/views/partials/botnet/bot.ejs',
        isAppend: true
    },
    events: {},
    beforeFirstRender: function (options) {
        this.$parentEl = this.$el
    },
    beforeRender: function () {
        this.renderData = {
            model: this.model,
            fileStats: BH.sharedHelpers.fileHelpers.getFileStats(this.model.get('machine').files)
        };
    },
    reRender: function () {
        this.remove();
        this.$el = this.$parentEl;
        this.render();
    },
    afterRender: function () {

    }
});

BH.views.Botnet = BH.views.BaseCollectionView.extend({
    defaults: {
        template: '/views/partials/botnet/botnet_manage.ejs',
        dataTablePage: 0,
        dataTableLength: 10,
        initTableColSort: 1,
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
                ]
            });
        }
    }
});