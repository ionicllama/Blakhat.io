$(function () {
    window.nh = new NH.views.MachineInfo({
        el: '#machineInfoContainer',
        model: new NH.models.Machine(machine)
    });
});