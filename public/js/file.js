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
        if (this.get('machine') && this.get('machine').password)
            data.password = this.get('machine').password;
        return data;
    },
    download: function () {
        new BH.models.Process({
            type: BH.sharedHelpers.processHelpers.types.FILE_DOWNLOAD,
            processMachine_id: BH.app.localMachine.get('machine')._id,
            machine_id: this.get('machine')._id,
            file: {
                _id: this.get('_id')
            }
        }).save(this.getPatchData(), {
                patch: true,
                success: $.proxy(function (data) {
                    BH.helpers.Toastr.showSuccessToast("Process started: Download file", null);

                    if (BH.app.localMachine.get('processes'))
                        BH.app.localMachine.get('processes').fetch();
                }, this),
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    },
    install: function () {
        new BH.models.Process({
            type: BH.sharedHelpers.processHelpers.types.FILE_INSTALL,
            processMachine_id: BH.app.localMachine.get('machine')._id,
            machine_id: this.get('machine')._id,
            file: {
                _id: this.get('_id')
            }
        }).save(this.getPatchData(), {
                patch: true,
                success: $.proxy(function (data) {
                    BH.helpers.Toastr.showSuccessToast("Process started: Install file", null);

                    if (BH.app.localMachine.get('processes'))
                        BH.app.localMachine.get('processes').fetch();
                }, this),
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    },
    run: function () {
        new BH.models.Process({
            type: BH.sharedHelpers.processHelpers.types.FILE_RUN,
            processMachine_id: BH.app.localMachine.get('machine')._id,
            machine_id: this.get('machine')._id,
            file: {
                _id: this.get('_id')
            }
        }).save(this.getPatchData(), {
                patch: true,
                success: $.proxy(function (data) {
                    BH.helpers.Toastr.showSuccessToast("Process started: Run " + BH.sharedHelpers.fileHelpers.getFileName(this.toJSON()), null);

                    if (BH.app.localMachine.get('processes'))
                        BH.app.localMachine.get('processes').fetch();
                }, this),
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    },
    copyToExternal: function () {
        new BH.models.Process({
            type: BH.sharedHelpers.processHelpers.types.FILE_COPY_EXTERNAL,
            file: {
                _id: this.get('_id')
            }
        }).save(this.getPatchData(), {
                patch: true,
                success: $.proxy(function (data) {
                    BH.helpers.Toastr.showSuccessToast("Process started: Copy file to external hdd", null);

                    if (BH.app.localMachine.get('processes'))
                        BH.app.localMachine.get('processes').fetch();
                }, this),
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    },
    moveToExternal: function () {
        new BH.models.Process({
            type: BH.sharedHelpers.processHelpers.types.FILE_MOVE_EXTERNAL,
            file: {
                _id: this.get('_id')
            }
        }).save(this.getPatchData(), {
                patch: true,
                success: $.proxy(function (data) {
                    BH.helpers.Toastr.showSuccessToast("Process started: Move file to external hdd", null);

                    if (BH.app.localMachine.get('processes'))
                        BH.app.localMachine.get('processes').fetch();
                }, this),
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    },
    copyToInternal: function () {
        new BH.models.Process({
            type: BH.sharedHelpers.processHelpers.types.FILE_COPY_INTERNAL,
            file: {
                _id: this.get('_id')
            }
        }).save(this.getPatchData(), {
                patch: true,
                success: $.proxy(function (data) {
                    BH.helpers.Toastr.showSuccessToast("Process started: Copy file to internal hdd", null);

                    if (BH.app.localMachine.get('processes'))
                        BH.app.localMachine.get('processes').fetch();
                }, this),
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    },
    moveToInternal: function () {
        new BH.models.Process({
            type: BH.sharedHelpers.processHelpers.types.FILE_MOVE_INTERNAL,
            file: {
                _id: this.get('_id')
            }
        }).save(this.getPatchData(), {
                patch: true,
                success: $.proxy(function (data) {
                    BH.helpers.Toastr.showSuccessToast("Process started: Move file to internal hdd", null);

                    if (BH.app.localMachine.get('processes'))
                        BH.app.localMachine.get('processes').fetch();
                }, this),
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    },
    delete: function () {
        new BH.models.Process({
            type: BH.sharedHelpers.processHelpers.types.FILE_DELETE,
            file: {
                _id: this.get('_id')
            }
        }).save(this.getPatchData(), {
                patch: true,
                success: $.proxy(function (data) {
                    BH.helpers.Toastr.showSuccessToast("Process started: Delete file", null);

                    if (BH.app.localMachine.get('processes'))
                        BH.app.localMachine.get('processes').fetch();
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
        return '/machine/' + this.options.machine._id + '/files/' + this.options.fileLocation;
    },
    afterInit: function () {
        this.on('sync', this.renderFiles, this);
        //this.on("change:selected", this.accountSelected, this);
        this.renderFiles();
    },
    renderFiles: function () {
        if (this.view) {
            this.view.collection = this;
            this.view.render();
        }
        else {
            this.view = new BH.views.Files({
                el: this.options.el,
                collection: this,
                machine: this.options.machine,
                childOptions: {
                    canDownloadFiles: this.options.canDownloadFiles,
                    fileLocation: this.options.fileLocation
                }
            });
        }
    }
});


//VIEWS
BH.views.File = BH.views.BaseCollectionChildView.extend({
    defaults: {
        template: '/views/partials/machine/file.ejs',
        isAppend: true
    },
    events: {
        'click .file-download': 'download',
        'click .file-run': 'run',
        'click .file-install': 'install',
        'click .file-copy-external': 'copyToExternal',
        'click .file-move-external': 'moveToExternal',
        'click .file-copy-internal': 'copyToInternal',
        'click .file-move-internal': 'moveToInternal',
        'click .file-delete': 'delete'
    },
    beforeFirstRender: function (options) {
        this.renderData = {
            model: this.model,
            canDownloadFiles: this.options.canDownloadFiles,
            fileLocation: this.options.fileLocation
        };
        this.listenTo(this.model, "destroy", this.remove);
    },
    download: function () {
        this.model.download();
    },
    run: function () {
        this.model.run();
    },
    install: function () {
        this.model.install();
    },
    copyToExternal: function () {
        this.model.copyToExternal();
    },
    moveToExternal: function () {
        this.model.moveToExternal();
    },
    copyToInternal: function () {
        this.model.copyToInternal();
    },
    moveToInternal: function () {
        this.model.moveToInternal();
    },
    delete: function () {
        this.model.delete();
    }
});

BH.views.Files = BH.views.BaseCollectionView.extend({
    defaults: {
        template: '/views/partials/machine/files.ejs',
        dataTablePage: 0,
        dataTableLength: 10,
        initTableColSort: 4,
        childView: BH.views.File
    },
    events: {
        'page.dt .data-table': 'pageNumberChanged',
        'length.dt .data-table': 'pageLengthChanged',
        'click .file-upload a': 'uploadFile'
    },
    beforeFirstRender: function (options) {
        var size = BH.sharedHelpers.fileHelpers.getFilesSizeTotal(this.collection.toJSON());
        this.hdd = this.options.machine.hdd;
        if (this.options.childOptions.fileLocation === 'external')
            this.hdd = this.options.machine.externalHDD;
        this.renderData = {
            hddProgress: (size / this.hdd.size) * 100,
            hddUsedString: BH.helpers.viewHelpers.getFilesSizeUsedString(this.hdd.size, size),
            uploadFiles: this.getUploadFiles(),
            fileLocation: this.options.childOptions.fileLocation,
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
            this.$('.data-table').DataTable({
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
                    {orderable: false, targets: -1}
                ],
                columns: [
                    null,
                    {type: "string"},
                    {type: "string"},
                    {type: "num"},
                    {type: "file-size"},
                    null
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

                    if (BH.app.localMachine.processes)
                        BH.app.localMachine.processes.fetch();
                }, this),
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    }
});