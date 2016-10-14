//MODELS
BH.models.Process = BH.models.BaseModel.extend({
    url: function () {
        if (this.get('_id'))
            return '/machine/' + this.get('processMachine_id') + '/process/' + this.get('_id');
        else
            return '/machine/' + this.get('processMachine_id') + '/process/';
    },
    initialize: function (model, options) {
        this.options = options ? options : {};

        this.set('processMachine_id', BH.app.localMachine.get('machine')._id);
    }
});


//COLLECTIONS
BH.collections.Processes = BH.collections.BaseCollection.extend({
    model: BH.models.Process,
    url: function () {
        return '/machine/' + this.options.machine._id + '/processes/';
    },
    afterInit: function () {
        this.on('sync', this.renderProcesses, this);
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
        'length.dt .data-table': 'pageLengthChanged',
        'change .processes-auto-finish': 'executeCompleteProcesses'
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
    },
    executeCompleteProcesses: function () {
        this.collection.trigger('execute');
    }
});

BH.views.Process = BH.views.BaseView.extend({
    defaults: {
        template: '/views/partials/machine/process.ejs',
        isAppend: true
    },
    events: {
        'click .process-execute': 'executeProcess',
        'click .process-remove': 'removeProcessConfirm'
    },
    beforeFirstRender: function (options) {
        this.$parentEl = this.$el;
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
        this.listenTo(this.model, "destroy", this.remove);
        this.listenTo(this.collection, "execute", this.executeProcess);

        this.progressBar = this.$('.process-progress > .progress-bar');
        var progress = BH.sharedHelpers.processHelpers.getProgress(this.model.attributes);
        if (progress < 100) {
            this.progressInterval = setInterval(_.bind(function () {
                var progress = BH.sharedHelpers.processHelpers.getProgress(this.model.attributes);
                if (progress < 100) {
                    var timeRemaining = BH.sharedHelpers.getTimeRemaining(new Date(this.model.get('end')));
                    BH.helpers.viewHelpers.updateProcessProgress(this.progressBar, progress, BH.helpers.viewHelpers.getTimeRemainingString(timeRemaining));
                }
                else {
                    clearInterval(this.progressInterval);
                    if (this.$el.closest('#processes').find('.processes-auto-finish').is(':checked'))
                        this.executeProcess();
                    else
                        this.reRender();
                }
            }, this), 1000);
        }
    },
    executeProcess: function () {
        if (!this.model.get('success') && BH.sharedHelpers.processHelpers.getProgress(this.model.attributes) >= 100) {
            this.model.save(null,
                {
                    patch: true,
                    success: $.proxy(function (data) {
                        if (this.model.get('type') === BH.sharedHelpers.processHelpers.types.UPDATE_LOG) {
                            BH.helpers.Toastr.showSuccessToast("Log updated successfully", null);
                            if (BH.app.currentMachine)
                                BH.app.currentMachine.fetchMachine();
                        }
                        else if (this.model.get('type') === BH.sharedHelpers.processHelpers.types.FILE_DOWNLOAD && BH.app.currentMachine) {
                            BH.helpers.Toastr.showSuccessToast("File downloaded successfully", null);
                            if (BH.app.currentMachine)
                                BH.app.currentMachine.fetchMachine();
                        }
                        else if (this.model.get('type') === BH.sharedHelpers.processHelpers.types.FILE_UPLOAD && BH.app.currentMachine) {
                            BH.helpers.Toastr.showSuccessToast("File uploaded successfully", null);
                            if (BH.app.currentMachine)
                                BH.app.currentMachine.fetchMachine();
                        }

                    }, this),
                    error: function (model, response) {
                        BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                    },
                    wait: true
                }
            );
        }
    },
    removeProcessConfirm: function () {
        if (this.model.get('success'))
            this.removeProcess();
        else
            new BH.views.DeleteModal({
                header: "Remove Process",
                body: "Are you sure you want to cancel and remove this process?",
                extras: {
                    buttonText: "Remove"
                },
                onConfirm: this.removeProcess.bind(this)
            });
    },
    removeProcess: function () {
        if (this.progressInterval)
            clearInterval(this.progressInterval);
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