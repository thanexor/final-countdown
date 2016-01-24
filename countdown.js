var gDoneButton;
var gInfoButton;
var daysOfWeek = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat'
];

var monthsOfYear = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
];

/* ----------------------------------------
 * Loaders
 *
 * Loads objects on body load.
 * ---------------------------------------- */
var Loader = function () {
    gDoneButton = new AppleGlassButton(document.getElementById("js-saveevent"), "Done", Prefs.flipToFront);
    gInfoButton = new AppleInfoButton(document.getElementById("js-infobutton"), document.getElementById("front"), "white", "white", Prefs.flipToBack);

    var d = new Date();
    var todayString = '' + d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();

    // check for and set already existing values
    var existingEvent = Storage.get(Storage.key());
    var existingTitle = null;
    var existingDate  = null;
    var existingBg    = null;

    if (existingEvent) {
        existingTitle = existingEvent.title;
        existingDate  = existingEvent.date;
        existingBg  = existingEvent.backgroundURL;
    }

    if (existingDate && existingTitle) {
        Countdown.init(existingDate, existingTitle);
        document.getElementById('js-frontcontent').style.backgroundImage = existingBg;
    } else {
        Countdown.init(todayString, 'Flip to add event');
        Countdown.updateText(document.getElementById('js-datedisplay'), Countdown.getFormattedDate(d));
    }
}


/* ----------------------------------------
 * Countdown
 *
 * Makes and instance of a countdown and updates the info on the page.
 * ---------------------------------------- */
var Countdown = Countdown || {};

Countdown = {
    eventDate: '',
    eventTitle: '',
    daysToEvent: 0,
    percentOfDayComplete: 0,
    backgroundURL: '',
    counter: null,

    init: function(eventDate, eventTitle) {
        Countdown.eventDate = eventDate;
        Countdown.eventTitle = eventTitle;

        var d = new Date(Countdown.eventDate);

        Countdown.updateText(document.getElementById('js-datedisplay'), Countdown.getFormattedDate(d));
        Countdown.updateText(document.getElementById('js-eventtitle'), Countdown.eventTitle);

        Countdown.setCounter();

        // resize window to account for different title lengths
        Countdown.setHeight();
    },

    timer: function () {
        var today = new Date();
        var eventDate = new Date(Countdown.eventDate);

        var msBetweenDates = eventDate.getTime() - today.getTime();
        Countdown.daysToEvent = Math.ceil(msBetweenDates / 1000 / 60 / 60 / 24);
        Countdown.percentOfDayComplete = today.getHours() / 24 + today.getMinutes() / 60 / 24 + today.getSeconds() / 60 / 60 / 24

        // update progress indicator circle with percentage
        Progress.updateMeter(Countdown.percentOfDayComplete);

        if (Countdown.daysToEvent == 0) {
            document.getElementById('js-daylabel').style.display = 'none';
            clearInterval(Countdown.counter);
            Countdown.updateText(document.getElementById('js-timeleft'), 'Today');
            return;
        } else {
            document.getElementById('js-daylabel').style.display = 'inline';

            if (Validate.isValidDate(Countdown.eventDate) && Validate.isInt(Countdown.daysToEvent)) {
                Countdown.updateText(document.getElementById('js-timeleft'), Countdown.daysToEvent, 10);
            } else {
                Countdown.updateText(document.getElementById('js-timeleft'), '??');
                Countdown.updateText(document.getElementById('js-eventtitle'), 'Not a valid date!');
            }
        }
    },

    setCounter: function () {
        clearInterval(Countdown.counter);
        Countdown.counter = setInterval(Countdown.timer, 1000);
    },

    updateText: function (ele, text) {
        ele.innerHTML = text;
    },

    getFormattedDate: function (dateObj) {
        if (Validate.isValidDate(dateObj)) {
            return daysOfWeek[dateObj.getDay()] + ', ' + monthsOfYear[dateObj.getMonth()] + ' ' + dateObj.getDate() + ', ' + dateObj.getFullYear();
        } else {
            return '????/??/??';
        }
    },

    setHeight: function () {
        var front = document.getElementById('front');
        var back  = document.getElementById('back');
        var frontContent = document.getElementById('js-frontcontent');
        var backContent  = document.getElementById('js-backcontent');

        // reset heights to auto
        front.style.height = '';
        back.style.height = '';
        frontContent.style.height = '';
        backContent.style.height = '';

        var contentHeight = front.offsetHeight;

        console.log(front.style.height, front.offsetHeight);

        // resize container elements to full height
        front.style.height = contentHeight + 'px';
        back.style.height = contentHeight + 'px';
        frontContent.style.height = contentHeight + 'px';
        backContent.style.height = contentHeight + 'px';

        console.log(contentHeight);

        // resize window to full height
        window.resizeTo(200, contentHeight);
    }

};

/* ----------------------------------------
 * Progress Indicator
 *
 * Makes a circle progress indicator to tell
 * the user what % completed of the day
 * that the current time is.
 * ---------------------------------------- */
var Progress = Progress || {};

Progress = {
    wrapper:   null,
    firstHalf: null,
    lastHalf:  null,
    hand:      null,

    degsFirstHalf: 0,
    degsLastHalf:  0,
    degsHand:      0,

    BEFORE_HALF_CLASS: 'progress_isBeforeHalf',

    setElements: function () {
        if (this.wrapper) {
            return;
        }

        this.wrapper = document.getElementById('js-progress');
        this.firstHalf = document.getElementById('js-progress-firsthalf');
        this.lastHalf = document.getElementById('js-progress-lasthalf');
        this.hand = document.getElementById('js-progress-hand');
    },

    updateMeter: function (percentOfDay) {
        // set Progress object elements
        this.setElements();

        if (percentOfDay * 100 <= 50) {
            this.wrapper.classList.add(this.BEFORE_HALF_CLASS);

            this.degsFirstHalf = 360 * percentOfDay;
            this.degsLastHalf = 180;
        } else {
            this.wrapper.classList.remove(this.BEFORE_HALF_CLASS);

            this.degsFirstHalf = 180;
            this.degsLastHalf = 360 * percentOfDay;
        }

        this.degsHand = Math.floor(360 * percentOfDay);

        this.firstHalf.style.webkitTransform = 'rotate(' + this.degsFirstHalf + 'deg)';
        this.lastHalf.style.webkitTransform = 'rotate(' + this.degsLastHalf + 'deg)';
        this.hand.style.webkitTransform = 'rotate(' + this.degsHand + 'deg)';
    }
};

/* ----------------------------------------
 * Preferences
 *
 * Handles the preference related methods.
 * ---------------------------------------- */
var Prefs = Prefs || {};

Prefs = {
    isSupported: function() {
        try {
            widget.setPreferenceForKey("widgetLoaded", "true");
            return true;
        } catch(e) {
            return false;
        }
    },

    flipToBack: function () {
        var front = document.getElementById('front');
        var back  = document.getElementById('back');

        if (window.widget) {
            widget.prepareForTransition("ToBack");
        }

        front.style.display = "none";
        back.style.display = "block";

        if (window.widget) {
            setTimeout ('widget.performTransition();', 0);
        }
    },

    flipToFront: function () {
        var front = document.getElementById("front");
        var back = document.getElementById("back");
        var titleValue;
        var dateValue;
        var bgValue;
        var formattedDate = '';

        if (window.widget) {
            widget.prepareForTransition("ToFront");
        }

        back.style.display = "none";
        front.style.display = "block";

        titleValue = document.getElementById('js-titlevalue').value;
        dateValue = document.getElementById('js-datevalue').value;

        if (window.widget) {
            setTimeout ('widget.performTransition();', 0);
        }

        // update title and date texts on front
        var d = new Date(dateValue);
        Countdown.updateText(document.getElementById('js-datedisplay'), Countdown.getFormattedDate(d));
        Countdown.updateText(document.getElementById('js-eventtitle'), titleValue);

        // update countdown properties
        Countdown.eventDate = dateValue;
        Countdown.eventTitle = titleValue;

        // update background image if present
        bgValue = document.getElementById('js-bgvalue').value;
        if (bgValue) {
            bgValue = 'url(' + bgValue + ')';
            Countdown.backgroundURL = 'url(' + bgValue + ')';
            console.log(bgValue, Countdown.backgroundURL)
        } else {
            bgValue = '';
            Countdown.backgroundURL = '';
            console.log(bgValue, Countdown.backgroundURL)
        }
        document.getElementById('js-frontcontent').style.backgroundImage = bgValue;

        var eventProps = {
            title: titleValue,
            date: dateValue,
            backgroundURL: bgValue
        };

        // save inputted title and date
        Storage.set(Storage.key(), eventProps);

        Countdown.init(dateValue, titleValue);
    }
};

/* ----------------------------------------
 * Validator
 *
 * Holds methods to validate certain types
 * of inputs.
 * ---------------------------------------- */
var Validate = Validate || {};

Validate = {
    isInt: function (value) {
        return !isNaN(parseInt(value,10)) && (parseFloat(value,10) == parseInt(value,10));
    },

    isValidDate: function (dateString) {
        var d = new Date(dateString);
        return d instanceof Date && isFinite(d);
    }
};

/* ----------------------------------------
 * Storage
 *
 * Makes a standard interface to store the
 * values from form.
 * ---------------------------------------- */
var Storage = Storage || {};

Storage = {
    isPreferenceSupported: function() {
        if (window.widget) {
            return true;
        } else {
            return false;
        }
    },

    set: function (itemKey, itemValue) {
        if (this.isPreferenceSupported()) {
            return widget.setPreferenceForKey(JSON.stringify(itemValue), itemKey);
        } else {
            return localStorage.setItem(itemKey, JSON.stringify(itemValue));
        }
    },

    get: function (itemKey) {
        if (this.isPreferenceSupported()) {
            return JSON.parse(widget.preferenceForKey(itemKey));
        } else {
            return JSON.parse(localStorage.getItem(itemKey));
        }
    },

    key: function () {
        if (this.isPreferenceSupported()) {
            return 'FC/' + widget.identifier;
        } else {
            return 'FC';
        }
    }
};









