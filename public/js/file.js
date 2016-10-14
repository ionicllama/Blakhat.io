//MODELS
BH.models.File = BH.models.BaseModel.extend({
    url: function () {
        if (this.get('_id'))
            return '/machine/' + this.get('machine')._id + '/file/' + this.get('_id');
        else
            return '/machine/' + this.get('machine')._id + '/file/';
    },
    initialize: function (model, options) {
        this.options = options ? options : {};

        if (this.options.machine)
            this.set('machine', this.options.machine);
    },
    getPatchData: function () {
        var data = {};
        if (this.get('machine').password)
            data.password = this.get('machine').password;
        return data;
    },
    downloadFile: function () {
        new BH.models.Process({
            type: BH.sharedHelpers.processHelpers.types.FILE_DOWNLOAD,
            processMachine_id: BH.app.localMachine.get('machine')._id,
            machine_id: this.get('machine')._id,
            file: {
                _id: this.get('file')._id
            }
        }).save(this.getPatchData(), {
                patch: true,
                success: $.proxy(function (data) {
                    BH.helpers.Toastr.showSuccessToast("Process started: Download file", null);

                    if (BH.app.localMachineProcesses)
                        BH.app.localMachineProcesses.fetch();
                }, this),
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    }
});


//COLLECTIONS
BH.collections.Files = BH.collections.BaseCollection.extend({
    model: BH.models.File,
    url: function () {
        return '/machine/' + this.options.machine._id + '/files/';
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
            machine: this.options.machine,
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
        'length.dt .data-table': 'pageLengthChanged',
        'click .file-upload a': 'uploadFile'
    },
    beforeFirstRender: function (options) {
        var size = BH.sharedHelpers.fileHelpers.getFilesSizeTotal(this.collection.toJSON());
        this.renderData = {
            hddProgress: (size / this.options.machine.hdd.size) * 100,
            hddUsedString: BH.helpers.viewHelpers.getFilesSizeUsedString(this.options.machine.hdd.size, size),
            uploadFiles: this.getUploadFiles(),
            canDownloadFiles: this.options.childOptions.canDownloadFiles
        };
        //this.listenTo(this.model, "change:log", this.render);
    },
    getUploadFiles: function () {
        return _.uniq(BH.app.localMachine.get("machine").files, function (file, key, a) {
            return BH.sharedHelpers.fileHelpers.getFileName(file);
        });
    },
    beforeChildrenRender: function () {
        this.childEl = this.$el.find('#fileList');
    },
    afterChildrenRender: function () {
        if (this.$('.data-table')) {
            var self = this;
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
    },
    uploadFile: function (e) {
        new BH.models.Process({
            type: BH.sharedHelpers.processHelpers.types.FILE_UPLOAD,
            processMachine_id: BH.app.localMachine.get('machine')._id,
            machine_id: this.options.machine._id,
            file: {
                _id: $(e.currentTarget).attr('file_id')
            }
        }).save(null, {
                patch: true,
                success: $.proxy(function (data) {
                    BH.helpers.Toastr.showSuccessToast("Process started: Upload File", null);

                    if (BH.app.localMachineProcesses)
                        BH.app.localMachineProcesses.fetch();
                }, this),
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    }
});

BH.views.File = BH.views.BaseView.extend({
    defaults: {
        template: '/views/partials/machine/file.ejs',
        isAppend: true
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
        this.model.downloadFile();
    },
    deleteFile: function () {
        new BH.views.DeleteModal({
            header: "Delete File",
            body: "Are you sure you want to delete this file?",
            extras: {
                buttonText: "Remove"
            },
            onConfirm: this.model.destroy.bind(this.model)
        });
    }
});