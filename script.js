document.addEventListener('DOMContentLoaded', function() {
    
    const navItems = document.querySelectorAll('.nav-item');
    const modules = document.querySelectorAll('.module-content');
    const plyrInstances = {};

    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return "00:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
        const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;
        return `${formattedMinutes}:${formattedSeconds}`;
    }

    gsap.to('.active .player-wrapper', {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: 'power3.out',
        delay: 0.1
    });

    modules.forEach(module => {
        const videoEl = module.querySelector('.custom-video');
        const timelineItems = module.querySelectorAll('.timeline-item');
        const glassContainer = module.querySelector('.glass-container'); 
        const customPoster = module.querySelector('.custom-poster'); 
        const posterMeta = module.querySelector('.poster-meta'); 
        const playerWrapper = module.querySelector('.player-wrapper'); 
        
        if (!videoEl) return;

        const chapterMarkers = [];
        timelineItems.forEach(item => {
            const timeInSeconds = parseFloat(item.getAttribute('data-time'));
            const titleElement = item.querySelector('.time-content strong');
            const title = titleElement ? titleElement.innerText : "Глава";
            chapterMarkers.push({ time: timeInSeconds, label: title });
        });

        const player = new Plyr(videoEl, {
            controls: [
                'play-large', 'play', 'progress', 'current-time', 
                'mute', 'volume', 'settings', 'fullscreen'
            ],
            settings: ['quality', 'speed'],
            ratio: '16:9',
            fullscreen: { enabled: true, fallback: true, iosNative: true },
            playsinline: true,
            tooltips: { controls: true, seek: true }, 
            markers: { enabled: true, points: chapterMarkers }
        });

        const moduleId = module.id;
        plyrInstances[moduleId] = player;

        // ==============================================================
        // ФИКС РАБОТАЕТ ТОЛЬКО НА ТЕЛЕФОНАХ (ширина 500px и меньше)
        // ==============================================================
        player.on('enterfullscreen', event => {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            // Если это iPhone - вызываем родной Apple-плеер
            if (isIOS) {
                const videoElement = player.media;
                if (videoElement && videoElement.webkitEnterFullscreen) {
                    videoElement.webkitEnterFullscreen();
                }
            } 
            // Если это Android-ТЕЛЕФОН (ширина 500px или меньше)
            else if (window.innerWidth <= 500) {
                if (module) {
                    module.style.transform = 'none';
                    module.style.animation = 'none';
                }
                if (glassContainer) {
                    glassContainer.style.backdropFilter = 'none';
                    glassContainer.style.webkitBackdropFilter = 'none';
                }
                if (playerWrapper) {
                    playerWrapper.style.transform = 'none';
                }
                document.body.style.overflow = 'hidden';
            }
        });

        player.on('exitfullscreen', event => {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            // Возвращаем стили обратно только если мы их стирали (на телефонах)
            if (!isIOS && window.innerWidth <= 500) {
                if (module) {
                    module.style.transform = '';
                    module.style.animation = '';
                }
                if (glassContainer) {
                    glassContainer.style.backdropFilter = '';
                    glassContainer.style.webkitBackdropFilter = '';
                }
                if (playerWrapper) {
                    playerWrapper.style.transform = '';
                }
                document.body.style.overflow = '';
            }
        });
        // ==============================================================

        player.on('loadedmetadata', () => {
            if (posterMeta && player.duration) {
                const totalTime = formatTime(player.duration);
                posterMeta.innerHTML = `<i class="fas fa-clock"></i> ${totalTime}`;
            }
        });

        if (customPoster) {
            customPoster.addEventListener('click', () => player.play());
            player.on('play', () => customPoster.classList.add('is-hidden'));
        }

        if (glassContainer) {
            player.on('play', () => {
                gsap.to(glassContainer, {
                    scale: 1.015, duration: 0.8, ease: 'elastic.out(1, 0.5)',
                    boxShadow: '0 30px 60px rgba(79, 70, 229, 0.2)' 
                });
            });
            player.on('pause', () => {
                gsap.to(glassContainer, {
                    scale: 1, duration: 0.5, ease: 'power2.out',
                    boxShadow: '0 25px 50px rgba(79, 70, 229, 0.15), 0 10px 15px rgba(0, 0, 0, 0.05)' 
                });
            });
        }

        timelineItems.forEach(item => {
            item.addEventListener('click', function() {
                const targetTime = parseFloat(this.getAttribute('data-time'));
                player.currentTime = targetTime;
                player.play(); 
                
                timelineItems.forEach(sib => sib.classList.remove('active', 'clicked-pulse'));
                this.classList.add('active', 'clicked-pulse');
                
                gsap.fromTo(this, { scale: 0.95 }, { scale: 1, duration: 0.4, ease: "back.out(1.5)" });
                setTimeout(() => this.classList.remove('clicked-pulse'), 400); 
            });
        });

        player.on('timeupdate', () => {
            const currentTime = player.currentTime;
            timelineItems.forEach((item, index) => {
                const itemTime = parseFloat(item.getAttribute('data-time'));
                const nextItem = timelineItems[index + 1];
                const nextTime = nextItem ? parseFloat(nextItem.getAttribute('data-time')) : Infinity;

                if (currentTime >= itemTime && currentTime < nextTime && !item.classList.contains('active')) {
                    timelineItems.forEach(sib => sib.classList.remove('active'));
                    item.classList.add('active');
                    gsap.fromTo(item, { backgroundColor: 'rgba(79, 70, 229, 0.2)' }, { backgroundColor: '#ffffff', duration: 0.5 });
                }
            });
        });
    });

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            const targetId = this.getAttribute('data-target');
            
            modules.forEach(mod => {
                mod.classList.remove('active');
                const player = plyrInstances[mod.id];
                const poster = mod.querySelector('.custom-poster');
                const timelineItems = mod.querySelectorAll('.timeline-item');
                
                if (player) { player.pause(); player.currentTime = 0; }
                if (poster) poster.classList.remove('is-hidden'); 
                if (timelineItems.length > 0) {
                    timelineItems.forEach(t => t.classList.remove('active'));
                    timelineItems[0].classList.add('active');
                }
            });

            const targetModule = document.getElementById(targetId);
            targetModule.classList.add('active');

            const targetPlayerWrapper = targetModule.querySelector('.player-wrapper');
            if (targetPlayerWrapper) {
                gsap.fromTo(targetPlayerWrapper, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
            }
        });
    });
});