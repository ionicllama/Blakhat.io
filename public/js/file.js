//MODELS
BH.models.File = BH.models.BaseModel.extend({
    url: function () {
        return '/machine/' + this.options.machine_id + '/file/' + this.get('_id');
    },
    initialize: function (model, options) {
        this.options = options;
        //this.on('sync', this.renderFile, this);
        //this.fetch();
    }
});


//COLLECTIONS
BH.collections.Files = BH.collections.BaseCollection.extend({
    model: BH.models.File,
    url: function () {
        return '/machine/' + this.options.machine_id + '/files/';
    },
    afterInit: function () {
        this.on('sync', this.renderFiles, this);
        //this.on("change:selected", this.accountSelected, this);
        this.renderFiles();
    },
    renderFiles: function () {
        this.view = new BH.views.Files({
            el: this.options.el,
            collection: this,
            childView: BH.views.File,
            childOptions: {
                canDownloadFiles: this.options.canDownloadFiles
            }
        });
    }
});


//VIEWS
BH.views.Files = BH.views.BaseCollectionView.extend({
    defaults: {
        template: '/views/partials/machine/files.ejs',
        dataTablePage: 0,
        dataTableLength: 10,
        initTableColSort: 1
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
        this.childEl = this.$el.find('#fileList');
    },
    afterChildrenRender: function () {
        if (this.$('.data-table')) {
            this.fileTable = this.$('.data-table').DataTable({
                displayStart: this.options.dataTablePage * this.options.dataTableLength,
                language: {
                    emptyTable: "No files",
                    "info": "Showing _START_ to _END_ of _TOTAL_ files",
                    "infoEmpty": "Showing 0 to 0 of 0 files",
                    "infoFiltered": " - filtered from _MAX_ files"
                },
                pageLength: this.options.dataTableLength,
                order: [this.options.initTableColSort, 'asc'],
                columnDefs: [
                    {orderable: false, targets: [0, -1]}
                ]
            });
        }
    }
});

BH.views.File = BH.views.BaseCollectionView.extend({
    defaults: {
        template: '/views/partials/machine/file.ejs'
    },
    events: {
        'click .file-download': 'downloadFile',
        'click .file-delete': 'deleteFile'
    },
    beforeFirstRender: function (options) {
        this.renderData = {
            model: this.model,
            canDownloadFiles: this.options.canDownloadFiles
        };
        this.listenTo(this.model, "destroy", this.remove);
    },
    downloadFile: function () {

    },
    deleteFile: function () {
        this.model.destroy();
    }
});