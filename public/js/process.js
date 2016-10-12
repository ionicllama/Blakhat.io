//MODELS
BH.models.Process = BH.models.BaseModel.extend({
    url: function () {
        if (this.get('_id'))
            return '/machine/' + this.get('machine_id') + '/process/' + this.get('_id');
        else
            return '/machine/' + this.get('machine_id') + '/process/';
    },
    initialize: function (model, options) {
        this.options = options ? options : {};

        if (this.options.machine_id)
            this.set('machine_id', this.options.machine_id);
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
        template: '/views/partials/machine/processes.ejs',
        dataTablePage: 0,
        dataTableLength: 10,
        initTableColSort: 0
    },
    events: {
        'page.dt .data-table': 'pageNumberChanged',
        'length.dt .data-table': 'pageLengthChanged'
    },
    beforeFirstRender: function (options) {
        this.renderData = {
            model: this.model
        };
        //this.listenTo(this.model, "change:log", this.render);
    },
    beforeChildrenRender: function () {
        this.childEl = this.$el.find('#processList');
    },
    afterChildrenRender: function () {
        if (this.$('.data-table')) {
            this.processTabe = this.$('.data-table').DataTable({
                displayStart: this.options.dataTablePage * this.options.dataTableLength,
                language: {
                    emptyTable: "No processes",
                    "info": "Showing _START_ to _END_ of _TOTAL_ processes",
                    "infoEmpty": "Showing 0 to 0 of 0 processes",
                    "infoFiltered": " - filtered from _MAX_ processes"
                },
                pageLength: this.options.dataTableLength,
                order: [this.options.initTableColSort, 'asc'],
                columnDefs: [
                    {orderable: false, targets: [-1]}
                ]
            });
        }
    }
});

BH.views.Process = BH.views.BaseView.extend({
    defaults: {
        template: '/views/partials/machine/process.ejs',
        isAppend: true
    },
    events: {
        'click .process-execute': 'executeProcess',
        'click .process-remove': 'removeProcess'
    },
    beforeFirstRender: function (options) {
        this.$parentEl = this.$el;
        this.listenTo(this.model, "destroy", this.remove);
        //this.listenTo(this.model, "change:log", this.render);
    },
    beforeRender: function () {
        this.renderData = {
            model: this.model,
            progress: BH.sharedHelpers.processHelpers.getProgress(this.model.attributes),
            timeRemaining: BH.sharedHelpers.getTimeRemaining(new Date(this.model.get('end')))
        };
    },
    reRender: function () {
        this.remove();
        this.$el = this.$parentEl;
        this.render();
    },
    afterRender: function () {
        this.progressBar = this.$('.process-progress > .progress-bar');
        var progress = BH.sharedHelpers.processHelpers.getProgress(this.model.attributes);
        if (progress < 100) {
            this.progressInterval = setInterval(_.bind(function () {
                var progress = BH.sharedHelpers.processHelpers.getProgress(this.model.attributes);
                if (progress < 100) {
                    var timeRemaining = BH.sharedHelpers.getTimeRemaining(new Date(this.model.get('end')));
                    BH.helpers.viewHelpers.updateProgressBar(this.progressBar, progress, BH.helpers.viewHelpers.getTimeRemainingString(timeRemaining));
                }
                else {
                    clearInterval(this.progressInterval);
                    this.reRender();
                }
            }, this), 1000);
        }
    },
    executeProcess: function () {
        this.model.save(null,
            {
                patch: true,
                success: $.proxy(function (data) {
                    this.reRender();
                    if (this.model.get('type') === BH.sharedHelpers.processHelpers.types.UPDATE_LOG && BH.app.currentMachine)
                        BH.app.currentMachine.fetchMachine();
                }, this),
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    },
    removeProcess: function () {
        if (this.progressInterval)
            clearInterval(this.progressInterval);
        this.model.destroy();
    }
});