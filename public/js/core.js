var NH = NH ? NH : {};


//Constants
NH.constants = {};
NH.constants.dataTypes = {
    JSON: "json"
};


//Base Models
NH.models = NH.models ? NH.models : {};
NH.models.Machine = Backbone.Model.extend({
    url: '/machine',
    idAttribute: "_id",
    getCPUName: function () {
        return this.get('cpu').cores + '-core ' + this.get('cpu').speed + ' MHz';
    },
    getInternetName: function () {
        return this.get('internet').speed.down + ' mb/s down - ' + this.get('internet').speed.up + ' mb/s up';
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
                    NH.utils.Toastr.showSuccessToast("CPU Upgraded", null);
                },
                error: function (data) {
                    // NH.utils.Toastr.showErrorToast("CPU Upgrade failed", null);
                },
                wait: true
            }
        );
    }
});


//Base Views
NH.views = NH.views ? NH.views : {};
NH.views.MachineInfo = Backbone.View.extend({
    initialize: function () {
        this.listenTo(this.model, "change", this.render);
        //if permissions allow && on button click eventually
        new NH.views.UpgradeCPU({
            el: '#cpuUpgradeContainer',
            model: this.model
        });
    },
    render: function () {
        this.$el.find('#machineIP').text(this.model.get('ip'));
        this.$el.find('#machineCPU').text(this.model.getCPUName());
        this.$el.find('#machineInternet').text(this.model.getInternetName());
        this.$el.find('#machineFirewall').text(this.model.get('firewall').level);
    }
});
NH.views.UpgradeCPU = Backbone.View.extend({
    initialize: function () {
        this.listenTo(this.model, "change", this.render);
        this.$el.find('#cpuUpgradeTable').dataTable({
            colReorder: {
                order: [2]
            }
        });

        this.$el.find('.buyButton').on('click', jQuery.proxy(function (r) {
            var cpuId = jQuery(r.target).attr('cpu-id');
            this.model.upgradeCPU(cpuId);
        }, this));
    }
});


//Base Utils
NH.utils = NH.utils ? NH.utils : {};
NH.utils.Toastr = {
    defaultOptions: {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-bottom-right",
        "preventDuplicates": true,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    },
    showSuccessToast: function (message, options) {
        toastr.options = this.defaultOptions;
        toastr["success"](message);
    },
    enableBSButton: function (obj, enable) {
        if (obj) {
            if (enable)
                obj.prop('disabled', false);
            else
                obj.prop('disabled', false);
        }
    }
};