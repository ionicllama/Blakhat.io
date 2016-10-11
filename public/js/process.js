//MODELS
BH.models.Process = BH.models.BaseModel.extend({
    url: '/Process',
    initialize: function () {
        //this.on('sync', this.renderMachine, this);
        //this.fetch();
    }
});


//COLLECTIONS
BH.collections.Processes = BH.collections.BaseCollection.extend({
    model: BH.models.Process,
    url: function () {
        return '/machine/' + this.options.machine_id + '/processes/';
    },
    afterInit: function () {
        this.on('sync', this.renderProcesses, this);
        //this.on("change:selected", this.accountSelected, this);
        this.renderProcesses();
    },
    renderProcesses: function () {
        this.view = new BH.views.Processes({
            el: this.options.el,
            collection: this,
            childView: BH.views.Process
        });
    }
});


//VIEWS
BH.views.Processes = BH.views.BaseCollectionView.extend({
    defaults: {
        template: '/views/partials/machine/processes.ejs'
    },
    events: {},
    beforeFirstRender: function (options) {
        this.renderData = {
            model: this.model
        };
        this.childEl = this.$el.find('#processList');
        //this.listenTo(this.model, "change:log", this.render);
    }
});

BH.views.Process = BH.views.BaseCollectionView.extend({
    defaults: {
        template: '/views/partials/machine/process.ejs'
    },
    events: {},
    beforeFirstRender: function (options) {
        this.renderData = {
            model: this.model
        };
        //this.listenTo(this.model, "change:log", this.render);
    }
});