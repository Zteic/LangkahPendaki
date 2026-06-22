/**
 * ENGINE INTERAKTIF LANDING PAGE PREMIUM - LANGKAH PENDAKI 2026
 * INTEGRASI PENUH LANGKAH 1 - LANGKAH 11 (BERSIH & SIAP PAKAI)
 */

document.addEventListener("DOMContentLoaded", () => {
    initDynamicHeroTextEngine();
    fetchLiveMySQLStatistics();
    renderLiveMySQLTestimonials();
    initScrollRevealObserverEngine();
    syncFooterDynamicMetadata();
    initSmartNavbarAndFloatingButtonEngine();
    initSmoothPageTransitionEngine();
    
    // Memicu pengisian data katalog produk pilihan
    renderCatalogProductsFromDatabase();

    // Auto Refresh Interval Polling data statistik dari MySQL setiap 15 detik
    setInterval(() => {
        fetchLiveMySQLStatistics();
    }, 15000);
});

// ==========================================================================
// LANGKAH 1 - DYNAMIC HERO TEXT CONTROLLER
// ==========================================================================
function initDynamicHeroTextEngine() {
    const targetEl = document.getElementById("dynamicHeroText");
    if (!targetEl) return;

    const keywords = [
        "Gunung Indonesia 🏔️",
        "Camping Ground 🏕️",
        "Hiking Track 🥾",
        "Epic Adventure 🌿",
        "Family Camp ⛺",
        "Weekend Escape 🪵"
    ];

    let currentIndex = 0;

    setInterval(() => {
        targetEl.classList.remove("opacity-100", "blur-0", "translate-y-0");
        targetEl.classList.add("opacity-0", "blur-md", "-translate-y-2");

        setTimeout(() => {
            currentIndex = (currentIndex + 1) % keywords.length;
            targetEl.textContent = keywords[currentIndex];

            targetEl.classList.remove("opacity-0", "blur-md", "-translate-y-2");
            targetEl.classList.add("opacity-100", "blur-0", "translate-y-0");
        }, 500);
    }, 3500);
}

// ==========================================================================
// LANGKAH 2 - LIVE STATISTICS ENGINE VIA AJAX POLLING
// ==========================================================================
function fetchLiveMySQLStatistics() {
    const history = JSON.parse(localStorage.getItem("userHistory")) || [];
    const products = JSON.parse(localStorage.getItem("inventory")) || [];

    const totalRenters = new Set(history.map(item => item.user)).size + 340;
    const totalTrips = history.filter(item => item.status === "Selesai").length + 124; 
    const totalAvailable = products.reduce((sum, item) => sum + parseInt(item.stock || 0), 0);
    const todayRentals = history.filter(item => item.status === "Pembayaran Diterima").length;

    animateLandingCounter("stat-renters", totalRenters);
    animateLandingCounter("stat-trips", totalTrips);
    animateLandingCounter("stat-available", totalAvailable);
    animateLandingCounter("stat-today", todayRentals);
}

function animateLandingCounter(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const startValue = parseInt(el.textContent) || 0;
    if (startValue === targetValue) return;

    let startTimestamp = null;
    const duration = 1200;

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentCount = Math.floor(progress * (targetValue - startValue) + startValue);
        
        el.textContent = currentCount.toLocaleString('id-ID');
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            el.textContent = targetValue.toLocaleString('id-ID');
        }
    };

    window.requestAnimationFrame(step);
}

// ==========================================================================
// LANGKAH 5 - REALTIME TESTIMONIAL LOADER & CAROUSEL SLIDER ENGINE
// ==========================================================================
let testimonialSlideInterval = null;
let testimonialCurrentTranslate = 0;
const testimonialCardWidth = 344;

function renderLiveMySQLTestimonials() {
    const track = document.getElementById("testimonialSliderTrack");
    if (!track) return;

    if (!localStorage.getItem("testimonials_db")) {
        const mockReviews = [
            { id: 1, name: "Agus Pratama", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100", rating: 5, date: "2026-06-10", comment: "Sewa tenda Borneo di sini frame-nya kokoh banget, pas badai di Suryakencana sama sekali gak goyang. Steril dan wangi!" },
            { id: 2, name: "Budi Sanjaya", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100", rating: 5, date: "2026-06-12", comment: "Carrier Deuter 60L-nya orisinil, backsystem-nya masih empuk gak bikin pundak pegal. QR scan checkout-nya cepet banget tanpa ribet." },
            { id: 3, name: "Rina Kartika", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100", rating: 4, date: "2026-06-13", comment: "Pelayanan Ranger Commander-nya top bgt, ramah diajak diskusi rute pendakian Gn. Prau. Kondisi nesting bersih mengkilap." },
            { id: 4, name: "Dedi Wijaya", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100", rating: 5, date: "2026-06-14", comment: "Sistem transparan gak ada denda siluman. Sangat direkomendasikan untuk pendaki pemula maupun pro." }
        ];
        localStorage.setItem("testimonials_db", JSON.stringify(mockReviews));
    }

    const reviews = JSON.parse(localStorage.getItem("testimonials_db")) || [];
    
    track.style.opacity = "0.3";
    
    setTimeout(() => {
        track.innerHTML = "";
        reviews.forEach(rev => {
            let stars = "⭐".repeat(rev.rating);
            const dateStr = new Date(rev.date).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'});

            track.innerHTML += `
                <div class="bg-white p-5 rounded-xl border border-stone-200/60 w-80 space-y-3 shadow-sm flex-shrink-0 hover:border-green-700 hover:shadow-md transition-all duration-300 select-none animate-fade-in">
                    <div class="flex items-center space-x-3">
                        <img src="${rev.avatar}" class="w-9 h-9 rounded-full object-cover border border-stone-200">
                        <div>
                            <h5 class="font-bold text-stone-900 text-xs">${rev.name}</h5>
                            <span class="text-[9px] text-stone-400 font-bold block">${dateStr}</span>
                        </div>
                    </div>
                    <div class="text-[10px] text-amber-500">${stars}</div>
                    <p class="text-[11.5px] text-stone-600 leading-relaxed font-medium">"${rev.comment}"</p>
                </div>`;
        });
        
        track.style.opacity = "1";
        resumeTestimonialSlider();
    }, 600);
}

window.resumeTestimonialSlider = function() {
    const track = document.getElementById("testimonialSliderTrack");
    const reviews = JSON.parse(localStorage.getItem("testimonials_db")) || [];
    if (!track || reviews.length <= 2) return;

    const maxTranslate = (reviews.length - 2) * testimonialCardWidth;

    testimonialSlideInterval = setInterval(() => {
        testimonialCurrentTranslate += testimonialCardWidth;
        if (testimonialCurrentTranslate > maxTranslate) {
            testimonialCurrentTranslate = 0;
        }
        track.style.transform = `translateX(-${testimonialCurrentTranslate}px)`;
    }, 3500);
};

window.freezeTestimonialSlider = function() {
    clearInterval(testimonialSlideInterval);
};

// ==========================================================================
// LANGKAH 6 & 7 - SCROLL REVEAL OBSERVER ENGINE & PREMIUM FOOTER HANDLER
// ==========================================================================
function initScrollRevealObserverEngine() {
    const revealElements = document.querySelectorAll(".scroll-reveal");
    
    const observerOptions = {
        root: null,
        threshold: 0.12
    };

    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove("opacity-0", "translate-y-8");
                entry.target.classList.add("opacity-100", "translate-y-0");
                observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(revealCallback, observerOptions);
    revealElements.forEach(el => observer.observe(el));
}

function syncFooterDynamicMetadata() {
    const currentYear = new Date().getFullYear();
    const copyrightYearEl = document.getElementById("dynamicCopyrightYear");
    if (copyrightYearEl) copyrightYearEl.textContent = currentYear;

    const history = JSON.parse(localStorage.getItem("userHistory")) || [];
    const products = JSON.parse(localStorage.getItem("inventory")) || [];

    const totalRenters = new Set(history.map(item => item.user)).size + 342;
    if (document.getElementById("f-metric-renters")) {
        document.getElementById("f-metric-renters").textContent = `${totalRenters}+`;
    }
    if (document.getElementById("f-metric-products") && products.length > 0) {
        document.getElementById("f-metric-products").textContent = `${products.length}+ Seri`;
    }
}

// ==========================================================================
// LANGKAH 8 & 10 - SMART NAVBAR TRANSITION & FLOATING ACTION BUTTON
// ==========================================================================
function initSmartNavbarAndFloatingButtonEngine() {
    const navbar = document.getElementById("smartNavbar");
    const topBtn = document.getElementById("btnScrollToTop");
    
    if (!navbar) return;

    window.addEventListener("scroll", () => {
        const scrollPosition = window.scrollY;

        if (scrollPosition > 50) {
            navbar.classList.remove("bg-transparent", "py-4");
            navbar.classList.add("bg-[#355E3B]", "py-3", "shadow-xl", "backdrop-blur-md");
        } else {
            navbar.classList.remove("bg-[#355E3B]", "py-3", "shadow-xl", "backdrop-blur-md");
            navbar.classList.add("bg-transparent", "py-4");
        }

        if (topBtn) {
            if (scrollPosition > 300) {
                topBtn.classList.remove("opacity-0", "translate-y-4", "pointer-events-none");
                topBtn.classList.add("opacity-100", "translate-y-0", "pointer-events-auto");
            } else {
                topBtn.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto");
                topBtn.classList.add("opacity-0", "translate-y-4", "pointer-events-none");
            }
        }
    });
}

// ==========================================================================
// LANGKAH 11 - SMOOTH PAGE TRANSITION INTERCEPTOR ENGINE
// ==========================================================================
function initSmoothPageTransitionEngine() {
    const progressBar = document.getElementById("pageTransitionProgressBar");
    const curtain = document.getElementById("pageTransitionCurtain");
    const localLinks = document.querySelectorAll("a[href$='.html']");

    localLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            const targetUrl = this.getAttribute("href");
            if (!targetUrl || targetUrl.startsWith("#")) return;

            e.preventDefault();

            if (progressBar && curtain) {
                progressBar.style.width = "85%";
                curtain.classList.remove("pointer-events-none");
                curtain.classList.add("opacity-100");

                setTimeout(() => {
                    progressBar.style.width = "100%";
                    window.location.href = targetUrl;
                }, 500);
            }
        });
    });
}

// ==========================================================================
// RENDER KATALOG PRODUK PILIHAN DARI DATABASE MOCK (MYSQL)
// ==========================================================================
function renderCatalogProductsFromDatabase() {
    const gridContainer = document.getElementById("catalogProductGrid");
    if (!gridContainer) return;

    // Set data seeder awal jika local storage kosong
    if (!localStorage.getItem("inventory")) {
        const defaultProducts = [
            { id: "PROD-1", name: "Eiger Backpack 60L", category: "Carrier", price: 45000, stock: 5, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500" },
            { id: "PROD-2", name: "Tenda Dome Borneo 4P", category: "Tenda", price: 60000, stock: 4, image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=500" },
            { id: "PROD-3", name: "Consina Magnum 2P", category: "Tenda", price: 35000, stock: 3, image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500" },
            { id: "PROD-4", name: "Kompor Portable Windproof", category: "Gear", price: 15000, stock: 12, image: "https://images.unsplash.com/photo-1596450514735-2d002fc043cd?w=500" }
        ];
        localStorage.setItem("inventory", JSON.stringify(defaultProducts));
    }

    const products = JSON.parse(localStorage.getItem("inventory")) || [];

    // Mengganti kotak abu-abu placeholder dengan data gambar web
    setTimeout(() => {
        gridContainer.innerHTML = "";
        
        products.forEach(p => {
            const formattedPrice = "Rp " + p.price.toLocaleString('id-ID') + " / hari";
            
            gridContainer.innerHTML += `
                <div class="bg-white p-4 rounded-xl border border-stone-200/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between text-xs font-semibold animate-fade-in group">
                    <div class="overflow-hidden rounded-lg mb-3 bg-stone-100 aspect-square relative">
                        <img src="${p.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${p.name}">
                        <span class="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">${p.category}</span>
                    </div>
                    <div class="space-y-1 mb-3 text-left">
                        <h4 class="text-stone-900 font-bold text-xs truncate">${p.name}</h4>
                        <p class="text-green-700 font-bold text-[11px]">${formattedPrice}</p>
                        <p class="text-[10px] text-stone-400 font-medium">Tersedia: ${p.stock} unit</p>
                    </div>
                    <button onclick="alert('Hubungi admin atau silakan login terlebih dahulu untuk menyewa ${p.name}')" class="w-full bg-[#355E3B] hover:bg-green-800 text-white font-bold py-2 rounded-lg transition transform active:scale-95 text-center text-[11px]">
                        Sewa Alat <i class="fa-solid fa-arrow-right ml-1 text-[9px]"></i>
                    </button>
                </div>`;
        });
    }, 800); 
}