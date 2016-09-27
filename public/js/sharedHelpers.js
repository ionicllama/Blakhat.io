/**
 * Created by Evan on 9/25/2016.
 */
(function (exports) {
    exports.sharedHelpers = {};

    exports.sharedHelpers.machineHelpers = {
        calculateCPUCost: function (cores, speed) {
            return (speed === 666 && cores === 1) ? 0 : Math.floor((Math.pow(speed, 2) * .001) * Math.pow(cores, 2));
        }
    };

}(typeof exports === 'undefined' ? (!this.NH ? this.NH = {} : this.NH = this.NH) : exports));