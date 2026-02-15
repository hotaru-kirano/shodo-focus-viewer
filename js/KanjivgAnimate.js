'use strict';

var KanjivgAnimate = (function () {

    function KanjivgAnimate(trigger, time) {
        time = typeof time !== 'undefined' ? time : 500;

        this.setOnClick(trigger, time);
    }

    /**
     * Add onclick function to triggers.
     *
     * @param {element} trigger
     * @param {int} time 
     */
    KanjivgAnimate.prototype.setOnClick = function setOnClick(trigger, time) {
        var triggers = document.querySelectorAll(trigger);

        var length = triggers.length;

        var kvganimate = this;

        for (var i = 0; i < length; i++) {
            triggers[i].onclick = function() {
                var animate = new KVGAnimator(time);

                animate.play(this);

                return false;
            };
        }
    };

    return KanjivgAnimate;
})();

var KVGAnimator = (function () {

    function KVGAnimator(time, onDone) {
        this.time = time;
        this.onDone = typeof onDone === 'function' ? onDone : null;
        this._timer = null;
        this._raf = null;
        this._stopped = false;
    }

    /**
     * Initiate the animation.
     * 
     * @param  {element} trigger 
     */
    KVGAnimator.prototype.play = function play(trigger) {
        this._stopped = false;
        var svg = this.findTarget(trigger);

        if (!svg || svg.tagName !== 'svg' || svg.querySelectorAll('path').length <= 0) {
            return;
        }

        this.paths = svg.querySelectorAll('path');

        this.numbers = svg.querySelectorAll('text');

        this.pathCount = this.paths.length;

        this.hideAll();

        this.count = 0;

        var path = this.paths[this.count];

        var number = this.numbers[this.count];

        this.animatePath(path, number);
    };

    KVGAnimator.prototype.stop = function stop() {
        this._stopped = true;
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        if (this._raf) {
            cancelAnimationFrame(this._raf);
            this._raf = null;
        }
    };

    /**
     * Find data target, if available.
     * 
     * @param  {element} trigger
     */
    KVGAnimator.prototype.findTarget = function findTarget(trigger) {
        var attribute = 'data-kanjivg-target';

        if (!trigger.hasAttribute(attribute)) {
            return trigger;
        }

        var target = trigger.getAttribute(attribute); 

        return document.querySelector(target);
    };

    /**
     * Hide paths and numbers before animation.
     */
    KVGAnimator.prototype.hideAll = function hideAll() {
        for (var i = 0; i < this.pathCount; i++) {
            this.paths[i].style.display = 'none';

            if (typeof this.numbers[i] !== 'undefined') {
                this.numbers[i].style.display = 'none';
            }
        }  
    };

    /**
     * Prepare for animation and call animation function.
     * 
     * @param  {element} path
     * @param  {element} number
     */
    KVGAnimator.prototype.animatePath = function animatePath(path, number) {
        var length = path.getTotalLength();

        path.style.display = 'block';

        if (typeof number !== 'undefined') {
            number.style.display = 'block';
        }

        path.style.transition = path.style.WebkitTransition = 'none';

        path.style.strokeDasharray = length + ' ' + length;

        path.style.strokeDashoffset = length;

        path.getBoundingClientRect();

        this.doAnimation(path, length);
    };

    /**
     * Do the animation.
     * 
     * @param  {path} path
     */
    KVGAnimator.prototype.doAnimation = function doAnimation(path, length) {
            if (this._stopped) {
                return;
            }

            var start = performance.now();
            var duration = Math.max(1, this.time);
            var self = this;

            function frame(now) {
                if (self._stopped) {
                    return;
                }

                var elapsed = now - start;
                var progress = Math.min(1, elapsed / duration);
                path.style.strokeDashoffset = String(length * (1 - progress));

                if (progress < 1) {
                    self._raf = requestAnimationFrame(frame);
                    return;
                }

                self._raf = null;
                self.count += 1;

                if (self.count < self.pathCount) {
                    var newPath = self.paths[self.count];
                    var newNumber = self.numbers[self.count];
                    self.animatePath(newPath, newNumber);
                } else if (self.onDone) {
                    self.onDone();
                }
            }

            this._raf = requestAnimationFrame(frame);
    };

    return KVGAnimator;
})();

//module.exports = KanjivgAnimate;
