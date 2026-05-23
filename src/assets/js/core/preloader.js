// Preloader helper
(() => {
    const updatePreload = () => {
        document.documentElement.classList.add('page-preload');

        let   width = 100,
                perfData = window.performance.timing, 
                EstimatedTime = -(perfData.loadEventEnd - perfData.navigationStart),
                time = $(".uc-preloader").length > 0 ? ((EstimatedTime/100)%500) * 10 : ((EstimatedTime/10)%50),
                percentage = $(".uc-preloader .percentage"),
                start = 0,
                end = 100,
                duration = time + 0;
                animateValue(percentage, start, end, duration);

        function animateValue(id, start, end, duration) {
            let   range = end - start,
                    current = start,
                    increment = end > start? 1 : -1,
                    stepTime = Math.abs(Math.floor(duration / range)),
                    obj = $(id);
                    tracker = $(".uc-preloader .tracker");
            let   timer = setInterval(function() {
                        current += increment;
                        $(obj).text(current);
                        tracker.attr('style', 'width:' + current + '%;');
                        if (current == end) {
                            clearInterval(timer);
                        }
                    }, stepTime);
        }
        setTimeout(function(){
            const preloader = document.querySelector('.uc-preloader');
            preloader && preloader.classList.add('loaded');
            document.documentElement.classList.add('loaded');
        }, time);
    };
    window.addEventListener('load', updatePreload);
})();